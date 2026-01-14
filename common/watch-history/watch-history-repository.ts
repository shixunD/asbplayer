import Dexie, { liveQuery } from 'dexie';

export interface WatchHistoryItem {
    id: string; // 使用文件名作为唯一 ID
    name: string; // 视频/音频文件名（包括扩展名）
    totalDuration: number; // 总时长（秒）
    lastPosition: number; // 上次观看位置（秒）
    firstWatched: number; // 首次观看时间戳
    lastWatched: number; // 最后观看时间戳
    subtitleName: string; // 字幕文件名
    videoPath: string; // 视频本地路径
    subtitlePath: string; // 字幕本地路径
}

interface WatchHistoryRecord extends WatchHistoryItem {
    index?: number;
}

class WatchHistoryDatabase extends Dexie {
    watchHistoryItems!: Dexie.Table<WatchHistoryRecord, number>;

    constructor() {
        super('WatchHistoryDatabase');
        this.version(1).stores({
            watchHistoryItems: '++index,id,name,lastWatched,firstWatched',
        });
    }
}

export interface WatchHistoryRepository {
    clear: () => Promise<void>;
    fetch: (count: number) => Promise<WatchHistoryItem[]>;
    fetchAll: () => Promise<WatchHistoryItem[]>;
    liveFetch: (callback: (items: WatchHistoryItem[]) => void) => () => void;
    save: (item: WatchHistoryItem) => Promise<void>;
    delete: (id: string) => Promise<void>;
    deleteMultiple: (ids: string[]) => Promise<void>;
    deleteOlderThan: (timestamp: number) => Promise<number>;
    findByName: (name: string) => Promise<WatchHistoryItem | undefined>;
    exportAll: () => Promise<WatchHistoryItem[]>;
    importAll: (items: WatchHistoryItem[], overwrite: boolean) => Promise<number>;
}

export class IndexedDBWatchHistoryRepository implements WatchHistoryRepository {
    private readonly _db = new WatchHistoryDatabase();

    async clear() {
        await this._db.watchHistoryItems.clear();
    }

    async fetch(count: number): Promise<WatchHistoryItem[]> {
        if (count <= 0) {
            return [];
        }

        const result = await this._db.watchHistoryItems
            .orderBy('lastWatched')
            .reverse()
            .limit(count)
            .toArray();
        return result;
    }

    async fetchAll(): Promise<WatchHistoryItem[]> {
        const result = await this._db.watchHistoryItems
            .orderBy('lastWatched')
            .reverse()
            .toArray();
        return result;
    }

    liveFetch(callback: (items: WatchHistoryItem[]) => void): () => void {
        const observable = liveQuery(() => this.fetchAll());
        const subscription = observable.subscribe(callback);
        return () => subscription.unsubscribe();
    }

    async save(item: WatchHistoryItem) {
        const record: WatchHistoryRecord = { ...item };
        const existingRecords = await this._db.watchHistoryItems.where('id').equals(item.id).toArray();

        if (existingRecords.length > 0) {
            record.index = existingRecords[0].index;
            // 保留首次观看时间
            record.firstWatched = existingRecords[0].firstWatched;
        }

        await this._db.watchHistoryItems.put(record);
    }

    async delete(id: string) {
        const keys = await this._db.watchHistoryItems.where('id').equals(id).primaryKeys();
        await this._db.watchHistoryItems.bulkDelete(keys);
    }

    async deleteMultiple(ids: string[]) {
        for (const id of ids) {
            await this.delete(id);
        }
    }

    async deleteOlderThan(timestamp: number): Promise<number> {
        const oldItems = await this._db.watchHistoryItems
            .where('lastWatched')
            .below(timestamp)
            .toArray();

        const keys = oldItems.map(item => item.index!).filter(Boolean);
        await this._db.watchHistoryItems.bulkDelete(keys);
        return keys.length;
    }

    async findByName(name: string): Promise<WatchHistoryItem | undefined> {
        const items = await this._db.watchHistoryItems.where('id').equals(name).toArray();
        return items.length > 0 ? items[0] : undefined;
    }

    async exportAll(): Promise<WatchHistoryItem[]> {
        return this.fetchAll();
    }

    async importAll(items: WatchHistoryItem[], overwrite: boolean): Promise<number> {
        let importedCount = 0;
        for (const item of items) {
            const existing = await this.findByName(item.id);
            if (!existing || overwrite) {
                await this.save(item);
                importedCount++;
            }
        }
        return importedCount;
    }
}
