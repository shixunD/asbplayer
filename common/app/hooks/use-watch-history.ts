import { useState, useEffect, useCallback, useRef } from 'react';
import { WatchHistoryItem, WatchHistoryRepository, IndexedDBWatchHistoryRepository } from '../../watch-history';

const SAVE_INTERVAL_MS = 5000; // 每 5 秒保存一次

export interface UseWatchHistoryOptions {
    repository?: WatchHistoryRepository;
}

export function useWatchHistory(options?: UseWatchHistoryOptions) {
    const repositoryRef = useRef<WatchHistoryRepository>(
        options?.repository ?? new IndexedDBWatchHistoryRepository()
    );
    const [items, setItems] = useState<WatchHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // 加载历史记录
    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedItems = await repositoryRef.current.fetchAll();
            setItems(fetchedItems);
        } catch (error) {
            console.error('Failed to fetch watch history:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 初始化加载
    useEffect(() => {
        refresh();
        // 订阅实时更新
        const unsubscribe = repositoryRef.current.liveFetch((newItems) => {
            setItems(newItems);
            setLoading(false);
        });
        return unsubscribe;
    }, [refresh]);

    // 保存历史记录
    const saveItem = useCallback(async (item: WatchHistoryItem) => {
        try {
            await repositoryRef.current.save(item);
        } catch (error) {
            console.error('Failed to save watch history item:', error);
        }
    }, []);

    // 删除单个记录
    const deleteItem = useCallback(async (id: string) => {
        try {
            await repositoryRef.current.delete(id);
        } catch (error) {
            console.error('Failed to delete watch history item:', error);
        }
    }, []);

    // 批量删除
    const deleteMultiple = useCallback(async (ids: string[]) => {
        try {
            await repositoryRef.current.deleteMultiple(ids);
        } catch (error) {
            console.error('Failed to delete watch history items:', error);
        }
    }, []);

    // 删除指定天数前的记录
    const deleteOlderThan = useCallback(async (days: number): Promise<number> => {
        try {
            const timestamp = Date.now() - days * 24 * 60 * 60 * 1000;
            return await repositoryRef.current.deleteOlderThan(timestamp);
        } catch (error) {
            console.error('Failed to delete old watch history items:', error);
            return 0;
        }
    }, []);

    // 清空所有记录
    const clearAll = useCallback(async () => {
        try {
            await repositoryRef.current.clear();
        } catch (error) {
            console.error('Failed to clear watch history:', error);
        }
    }, []);

    // 根据文件名查找记录
    const findByName = useCallback(async (name: string): Promise<WatchHistoryItem | undefined> => {
        try {
            return await repositoryRef.current.findByName(name);
        } catch (error) {
            console.error('Failed to find watch history item:', error);
            return undefined;
        }
    }, []);

    // 导出历史记录
    const exportHistory = useCallback(async (): Promise<string> => {
        try {
            const allItems = await repositoryRef.current.exportAll();
            return JSON.stringify(allItems, null, 2);
        } catch (error) {
            console.error('Failed to export watch history:', error);
            return '[]';
        }
    }, []);

    // 导入历史记录
    const importHistory = useCallback(async (jsonString: string, overwrite: boolean = false): Promise<number> => {
        try {
            const items = JSON.parse(jsonString) as WatchHistoryItem[];
            return await repositoryRef.current.importAll(items, overwrite);
        } catch (error) {
            console.error('Failed to import watch history:', error);
            return 0;
        }
    }, []);

    return {
        items,
        loading,
        refresh,
        saveItem,
        deleteItem,
        deleteMultiple,
        deleteOlderThan,
        clearAll,
        findByName,
        exportHistory,
        importHistory,
    };
}

// 节流 Hook，用于保存播放进度
export function useWatchHistoryRecorder(
    repository?: WatchHistoryRepository,
    saveIntervalMs: number = SAVE_INTERVAL_MS
) {
    const repositoryRef = useRef<WatchHistoryRepository>(
        repository ?? new IndexedDBWatchHistoryRepository()
    );
    const lastSaveTimeRef = useRef<number>(0);
    const pendingItemRef = useRef<WatchHistoryItem | null>(null);

    // 节流保存
    const recordProgress = useCallback(
        async (
            videoFile: File,
            currentTime: number,
            duration: number,
            subtitleFile?: File
        ) => {
            const now = Date.now();
            const item: WatchHistoryItem = {
                id: videoFile.name,
                name: videoFile.name,
                totalDuration: duration,
                lastPosition: currentTime,
                firstWatched: now,
                lastWatched: now,
                subtitleName: subtitleFile?.name ?? '',
                videoPath: videoFile.name, // 本地文件只能获取文件名
                subtitlePath: subtitleFile?.name ?? '',
            };

            pendingItemRef.current = item;

            // 节流：每 saveIntervalMs 毫秒最多保存一次
            if (now - lastSaveTimeRef.current >= saveIntervalMs) {
                lastSaveTimeRef.current = now;
                try {
                    await repositoryRef.current.save(item);
                } catch (error) {
                    console.error('Failed to record watch progress:', error);
                }
            }
        },
        [saveIntervalMs]
    );

    // 强制保存（用于页面卸载或视频结束时）
    const forceSave = useCallback(async () => {
        if (pendingItemRef.current) {
            try {
                await repositoryRef.current.save(pendingItemRef.current);
                pendingItemRef.current = null;
            } catch (error) {
                console.error('Failed to force save watch progress:', error);
            }
        }
    }, []);

    return {
        recordProgress,
        forceSave,
    };
}
