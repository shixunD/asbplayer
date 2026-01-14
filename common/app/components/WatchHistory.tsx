import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '@mui/styles';
import { type Theme } from '@mui/material';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import InputAdornment from '@mui/material/InputAdornment';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { WatchHistoryItem } from '../../watch-history';

const useStyles = makeStyles<Theme>((theme) => ({
    root: {
        width: '100%',
        marginTop: theme.spacing(2),
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing(1, 2),
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
    },
    headerTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
    },
    toolbar: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        padding: theme.spacing(1, 2),
        flexWrap: 'wrap',
    },
    searchField: {
        minWidth: 200,
    },
    deleteOldContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
    },
    daysInput: {
        width: 80,
    },
    tableContainer: {
        maxHeight: 400,
    },
    truncatedText: {
        maxWidth: 150,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    clickableRow: {
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
    },
    emptyMessage: {
        textAlign: 'center',
        padding: theme.spacing(4),
        color: theme.palette.text.secondary,
    },
}));

interface WatchHistoryProps {
    items: WatchHistoryItem[];
    loading: boolean;
    onDelete: (id: string) => Promise<void>;
    onDeleteMultiple: (ids: string[]) => Promise<void>;
    onDeleteOlderThan: (days: number) => Promise<number>;
    onExport: () => Promise<string>;
    onImport: (jsonString: string, overwrite: boolean) => Promise<number>;
    onOpenVideo: (item: WatchHistoryItem) => void;
}

type SortKey = 'name' | 'firstWatched' | 'lastWatched' | 'totalDuration' | 'lastPosition';
type SortOrder = 'asc' | 'desc';

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function truncateText(text: string, maxLength: number = 20): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

export default function WatchHistory({
    items,
    loading,
    onDelete,
    onDeleteMultiple,
    onDeleteOlderThan,
    onExport,
    onImport,
    onOpenVideo,
}: WatchHistoryProps) {
    const { t } = useTranslation();
    const classes = useStyles();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 状态
    const [expanded, setExpanded] = useState(true);
    const [selected, setSelected] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [sortKey, setSortKey] = useState<SortKey>('lastWatched');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [deleteOlderDays, setDeleteOlderDays] = useState<number>(30);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);
    const [confirmDeleteOldOpen, setConfirmDeleteOldOpen] = useState(false);

    // 过滤和排序
    const filteredItems = useMemo(() => {
        let result = items;

        // 搜索过滤
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (item) =>
                    item.name.toLowerCase().includes(query) ||
                    item.subtitleName.toLowerCase().includes(query)
            );
        }

        // 排序
        result = [...result].sort((a, b) => {
            let comparison = 0;
            switch (sortKey) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'firstWatched':
                    comparison = a.firstWatched - b.firstWatched;
                    break;
                case 'lastWatched':
                    comparison = a.lastWatched - b.lastWatched;
                    break;
                case 'totalDuration':
                    comparison = a.totalDuration - b.totalDuration;
                    break;
                case 'lastPosition':
                    comparison = a.lastPosition - b.lastPosition;
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [items, searchQuery, sortKey, sortOrder]);

    // 分页后的数据
    const paginatedItems = useMemo(() => {
        const start = page * rowsPerPage;
        return filteredItems.slice(start, start + rowsPerPage);
    }, [filteredItems, page, rowsPerPage]);

    // 处理排序
    const handleSort = useCallback((key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc');
        }
    }, [sortKey, sortOrder]);

    // 处理选择
    const handleSelectAll = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelected(filteredItems.map((item) => item.id));
        } else {
            setSelected([]);
        }
    }, [filteredItems]);

    const handleSelectOne = useCallback((id: string) => {
        setSelected((prev) => {
            if (prev.includes(id)) {
                return prev.filter((i) => i !== id);
            }
            return [...prev, id];
        });
    }, []);

    // 删除选中
    const handleDeleteSelected = useCallback(async () => {
        await onDeleteMultiple(selected);
        setSelected([]);
        setConfirmDeleteOpen(false);
    }, [selected, onDeleteMultiple]);

    // 删除旧记录
    const handleDeleteOld = useCallback(async () => {
        await onDeleteOlderThan(deleteOlderDays);
        setConfirmDeleteOldOpen(false);
    }, [deleteOlderDays, onDeleteOlderThan]);

    // 导出
    const handleExport = useCallback(async () => {
        const json = await onExport();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `watch-history-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [onExport]);

    // 导入
    const handleImportClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleImportFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target?.result as string;
            try {
                await onImport(content, false);
            } catch (error) {
                console.error('Failed to import:', error);
            }
        };
        reader.readAsText(file);

        // 重置 input
        event.target.value = '';
    }, [onImport]);

    // 点击行打开视频
    const handleRowClick = useCallback((item: WatchHistoryItem) => {
        onOpenVideo(item);
    }, [onOpenVideo]);

    return (
        <Paper className={classes.root}>
            {/* 可折叠标题 */}
            <Box className={classes.header} onClick={() => setExpanded(!expanded)}>
                <Box className={classes.headerTitle}>
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    <Typography variant="subtitle1">
                        {t('watchHistory.title')} ({items.length})
                    </Typography>
                </Box>
            </Box>

            <Collapse in={expanded}>
                {/* 工具栏 */}
                <Box className={classes.toolbar}>
                    <TextField
                        className={classes.searchField}
                        size="small"
                        placeholder={t('watchHistory.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        disabled={selected.length === 0}
                        onClick={() => setConfirmDeleteOpen(true)}
                    >
                        {t('watchHistory.deleteSelected')} ({selected.length})
                    </Button>

                    <Box className={classes.deleteOldContainer}>
                        <TextField
                            className={classes.daysInput}
                            size="small"
                            type="number"
                            value={deleteOlderDays}
                            onChange={(e) => setDeleteOlderDays(Math.max(1, parseInt(e.target.value) || 1))}
                            inputProps={{ min: 1 }}
                        />
                        <Button
                            size="small"
                            onClick={() => setConfirmDeleteOldOpen(true)}
                        >
                            {t('watchHistory.deleteOlderThan')}
                        </Button>
                    </Box>

                    <Tooltip title={t('watchHistory.export')}>
                        <IconButton size="small" onClick={handleExport}>
                            <FileDownloadIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={t('watchHistory.import')}>
                        <IconButton size="small" onClick={handleImportClick}>
                            <FileUploadIcon />
                        </IconButton>
                    </Tooltip>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        hidden
                        onChange={handleImportFile}
                    />
                </Box>

                {/* 表格 */}
                {items.length === 0 ? (
                    <Typography className={classes.emptyMessage}>
                        {t('watchHistory.empty')}
                    </Typography>
                ) : (
                    <>
                        <TableContainer className={classes.tableContainer}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                indeterminate={
                                                    selected.length > 0 &&
                                                    selected.length < filteredItems.length
                                                }
                                                checked={
                                                    filteredItems.length > 0 &&
                                                    selected.length === filteredItems.length
                                                }
                                                onChange={handleSelectAll}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TableSortLabel
                                                active={sortKey === 'name'}
                                                direction={sortKey === 'name' ? sortOrder : 'asc'}
                                                onClick={() => handleSort('name')}
                                            >
                                                {t('watchHistory.name')}
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell>
                                            <TableSortLabel
                                                active={sortKey === 'firstWatched'}
                                                direction={sortKey === 'firstWatched' ? sortOrder : 'asc'}
                                                onClick={() => handleSort('firstWatched')}
                                            >
                                                {t('watchHistory.firstWatched')} / {t('watchHistory.lastPosition')}
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell>
                                            <TableSortLabel
                                                active={sortKey === 'totalDuration'}
                                                direction={sortKey === 'totalDuration' ? sortOrder : 'asc'}
                                                onClick={() => handleSort('totalDuration')}
                                            >
                                                {t('watchHistory.totalDuration')}
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell>{t('watchHistory.subtitle')}</TableCell>
                                        <TableCell>{t('watchHistory.actions')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedItems.map((item) => (
                                        <TableRow
                                            key={item.id}
                                            hover
                                            className={classes.clickableRow}
                                            selected={selected.includes(item.id)}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selected.includes(item.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={() => handleSelectOne(item.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={item.name}>
                                                    <span className={classes.truncatedText}>
                                                        {truncateText(item.name)}
                                                    </span>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>{formatDate(item.firstWatched)} / {formatDuration(item.lastPosition)}</TableCell>
                                            <TableCell>{formatDuration(item.totalDuration)}</TableCell>
                                            <TableCell>
                                                <Tooltip title={item.subtitleName || '-'}>
                                                    <span className={classes.truncatedText}>
                                                        {item.subtitleName ? truncateText(item.subtitleName) : '-'}
                                                    </span>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Tooltip title={t('watchHistory.openVideo')}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRowClick(item);
                                                            }}
                                                        >
                                                            <PlayArrowIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title={t('watchHistory.delete')}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDelete(item.id);
                                                            }}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            component="div"
                            count={filteredItems.length}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[10, 20, 50]}
                            labelRowsPerPage={t('watchHistory.rowsPerPage')}
                        />
                    </>
                )}
            </Collapse>

            {/* 确认删除选中对话框 */}
            <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
                <DialogTitle>{t('watchHistory.confirmDeleteTitle')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t('watchHistory.confirmDeleteMessage', { count: selected.length })}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDeleteOpen(false)}>
                        {t('action.cancel')}
                    </Button>
                    <Button onClick={handleDeleteSelected} color="error">
                        {t('action.delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 确认删除旧记录对话框 */}
            <Dialog open={confirmDeleteOldOpen} onClose={() => setConfirmDeleteOldOpen(false)}>
                <DialogTitle>{t('watchHistory.confirmDeleteOldTitle')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t('watchHistory.confirmDeleteOldMessage', { days: deleteOlderDays })}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDeleteOldOpen(false)}>
                        {t('action.cancel')}
                    </Button>
                    <Button onClick={handleDeleteOld} color="error">
                        {t('action.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}
