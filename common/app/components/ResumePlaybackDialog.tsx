import React from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

interface ResumePlaybackDialogProps {
    open: boolean;
    fileName: string;
    lastPosition: number;
    onResume: () => void;
    onStartOver: () => void;
    onClose: () => void;
}

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function ResumePlaybackDialog({
    open,
    fileName,
    lastPosition,
    onResume,
    onStartOver,
    onClose,
}: ResumePlaybackDialogProps) {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{t('watchHistory.resumeTitle')}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {t('watchHistory.resumeMessage', {
                        fileName: fileName.length > 30 ? fileName.slice(0, 30) + '...' : fileName,
                        position: formatDuration(lastPosition),
                    })}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onStartOver}>
                    {t('watchHistory.startOver')}
                </Button>
                <Button onClick={onResume} variant="contained" color="primary">
                    {t('watchHistory.resume')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
