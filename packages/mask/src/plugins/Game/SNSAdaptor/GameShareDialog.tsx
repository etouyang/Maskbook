import { useCallback } from 'react'
import { makeStyles } from '@masknet/theme'
import { Button, Typography, Box } from '@mui/material'
import { activatedSocialNetworkUI } from '../../../social-network'
import { useI18N } from '../../../utils'
import type { GameInfo } from '../types'

const useStyles = makeStyles()((theme) => ({
    root: {
        margin: theme.spacing(0, 2.5),
        zIndex: 99999,
    },
    shareNotice: {
        color: '#222',
        fontSize: '16px',
        fontFamily: 'TwitterChirp',
        lineHeight: '16px',
        marginTop: theme.spacing(2),
    },
    shareButton: {
        width: '100%',
        margin: theme.spacing(4, 0, 3),
    },
}))

interface PetSetDialogProps {
    onClose: () => void
    gameInfo: GameInfo | undefined
}

export default function GameShareDialog({ onClose, gameInfo }: PetSetDialogProps) {
    const { t } = useI18N()
    const { classes } = useStyles()

    const shareText = `I just play game ${gameInfo?.name} ${gameInfo?.twitterId} with @realMaskNetwork (powered by @NonFFriend). Visit my profile to check it out! Install Mask Network extension from mask.io and set yours.\n #mask_io #nonfungiblefriends`

    const onShareClick = useCallback(() => {
        activatedSocialNetworkUI.utils.share?.(shareText)
        onClose()
    }, [onClose])

    return (
        <Box className={classes.root}>
            <Typography className={classes.shareNotice}>{t('plugin_game_dialog_info')}</Typography>
            <Button onClick={onShareClick} variant="contained" size="large" className={classes.shareButton}>
                {t('plugin_game_share_btn')}
            </Button>
        </Box>
    )
}
