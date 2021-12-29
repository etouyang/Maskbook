import { makeStyles, useStylesExtends } from '@masknet/theme'
import { Button, Typography, Box } from '@mui/material'
import { activatedSocialNetworkUI } from '../../../social-network'
import { useCallback } from 'react'
import { useI18N } from '../../../utils'
import { Share_Twitter } from '../constants'

const useStyles = makeStyles()((theme) => ({
    root: {
        margin: theme.spacing(0, 2.5),
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
    onShare: () => void
}

export function PetShareDialog({ onShare }: PetSetDialogProps) {
    const { t } = useI18N()
    const classes = useStylesExtends(useStyles(), {})
    const shareLink = activatedSocialNetworkUI.utils.getShareLinkURL?.('')

    const onConform = useCallback(() => {
        if (shareLink) {
            const searchWorld =
                '?text=' + encodeURIComponent('hello world' + '\n' + '#mask.io #MintTeam' + '\n' + Share_Twitter)
            shareLink.search = searchWorld
            shareLink.href = shareLink.origin + shareLink.pathname + searchWorld
            const share = shareLink.toString()

            if (share) window.open(share, '_blank', 'noopener noreferrer')
        }
        onShare()
    }, [shareLink])

    return (
        <Box className={classes.root}>
            <Typography className={classes.shareNotice}>{t('plugin_pets_dialog_success')}</Typography>
            <Button onClick={onConform} variant="contained" size="large" className={classes.shareButton}>
                {t('plugin_pets_dialog_btn_share')}
            </Button>
        </Box>
    )
}
