import React from 'react';
import { Trans } from 'react-i18next';
import { makeStyles } from '@mui/styles';
import gt from 'semver/functions/gt';
import Fade from '@mui/material/Fade';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ChromeExtension from '../services/chrome-extension';
import { type Theme } from '@mui/material';
import { useAppBarHeight } from '../hooks/use-app-bar-height';
import { VideoTabModel } from '../..';
import VideoElementSelector from './VideoElementSelector';
import WatchHistory from './WatchHistory';
import { WatchHistoryItem } from '../../watch-history';

interface StylesProps {
    appBarHidden: boolean;
    appBarHeight: number;
}

const useStyles = makeStyles<Theme, StylesProps>((theme) => ({
    background: ({ appBarHidden, appBarHeight }) => ({
        position: 'absolute',
        height: appBarHidden ? '100vh' : `calc(100vh - ${appBarHeight}px)`,
        width: '100%',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        textAlign: 'center',
        overflow: 'auto',
    }),
    browseLink: {
        cursor: 'pointer',
    },
    videoElementSelectorContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        padding: theme.spacing(2),
        width: '100%',
    },
    watchHistoryContainer: {
        width: '100%',
        maxWidth: 900,
        marginTop: theme.spacing(3),
        textAlign: 'left',
    },
}));

interface Props {
    extension: ChromeExtension;
    latestExtensionVersion: string;
    extensionUrl: string;
    loading: boolean;
    dragging: boolean;
    appBarHidden: boolean;
    videoElements: VideoTabModel[];
    onFileSelector: React.MouseEventHandler<HTMLAnchorElement> &
        React.MouseEventHandler<HTMLSpanElement> &
        React.MouseEventHandler<HTMLLabelElement>;
    onVideoElementSelected: (videoElement: VideoTabModel) => void;
    // Watch history props
    watchHistoryItems: WatchHistoryItem[];
    watchHistoryLoading: boolean;
    onWatchHistoryDelete: (id: string) => Promise<void>;
    onWatchHistoryDeleteMultiple: (ids: string[]) => Promise<void>;
    onWatchHistoryDeleteOlderThan: (days: number) => Promise<number>;
    onWatchHistoryExport: () => Promise<string>;
    onWatchHistoryImport: (jsonString: string, overwrite: boolean) => Promise<number>;
    onWatchHistoryOpenVideo: (item: WatchHistoryItem) => void;
}

export default function LandingPage({
    extension,
    latestExtensionVersion,
    extensionUrl,
    loading,
    dragging,
    appBarHidden,
    videoElements,
    onFileSelector,
    onVideoElementSelected,
    watchHistoryItems,
    watchHistoryLoading,
    onWatchHistoryDelete,
    onWatchHistoryDeleteMultiple,
    onWatchHistoryDeleteOlderThan,
    onWatchHistoryExport,
    onWatchHistoryImport,
    onWatchHistoryOpenVideo,
}: Props) {
    const appBarHeight = useAppBarHeight();
    const classes = useStyles({ appBarHidden, appBarHeight });
    const extensionUpdateAvailable = extension.version && gt(latestExtensionVersion, extension.version);

    return (
        <Paper square className={classes.background}>
            <Fade in={!loading && !dragging} timeout={500}>
                <div>
                    <Typography variant="h6">
                        <Trans i18nKey={'landing.cta'}>
                            Drag and drop subtitle and media files, or
                            <Link
                                className={classes.browseLink}
                                onClick={onFileSelector}
                                color="primary"
                                component="label"
                            >
                                browse
                            </Link>
                            .
                        </Trans>
                        <br />
                        {!extension.installed && (
                            <Trans i18nKey="landing.extensionNotInstalled">
                                Install the
                                <Link color="primary" target="_blank" rel="noreferrer" href={extensionUrl}>
                                    Chrome extension
                                </Link>
                                to sync subtitles with streaming video.
                            </Trans>
                        )}
                        {extensionUpdateAvailable && (
                            <Trans i18nKey="landing.extensionUpdateAvailable">
                                An extension
                                <Link color="primary" target="_blank" rel="noreferrer" href={extensionUrl}>
                                    update
                                </Link>{' '}
                                is available.
                            </Trans>
                        )}
                    </Typography>
                    {extension.supportsLandingPageStreamingVideoElementSelector && videoElements.length > 0 && (
                        <div className={classes.videoElementSelectorContainer}>
                            <VideoElementSelector
                                videoElements={videoElements}
                                onVideoElementSelected={onVideoElementSelected}
                            />
                        </div>
                    )}
                    {/* Watch History Section */}
                    <Box className={classes.watchHistoryContainer}>
                        <WatchHistory
                            items={watchHistoryItems}
                            loading={watchHistoryLoading}
                            onDelete={onWatchHistoryDelete}
                            onDeleteMultiple={onWatchHistoryDeleteMultiple}
                            onDeleteOlderThan={onWatchHistoryDeleteOlderThan}
                            onExport={onWatchHistoryExport}
                            onImport={onWatchHistoryImport}
                            onOpenVideo={onWatchHistoryOpenVideo}
                        />
                    </Box>
                </div>
            </Fade>
        </Paper>
    );
}
