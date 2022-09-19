import { Button, DialogActions, DialogContent, Slider } from '@mui/material'
import AvatarEditor from 'react-avatar-editor'
import { makeStyles, parseColor, useCustomSnackbar } from '@masknet/theme'
import { useCallback, useState } from 'react'
import { Twitter } from '@masknet/web3-providers'
import { ChainId } from '@masknet/web3-shared-evm'
import { getAvatarId } from '../../../social-network-adaptor/twitter.com/utils/user'
import { usePersonaConnectStatus } from '../../../components/DataSource/usePersonaConnectStatus'
import type { BindingProof } from '@masknet/shared-base'
import { useI18N } from '../locales/i18n_generated'
import { context } from '../context'
import { useSubscription } from 'use-subscription'
import type { NetworkPluginID } from '@masknet/web3-shared-base'
import { useCurrentWeb3NetworkPluginID } from '@masknet/plugin-infra/web3'
import { AvatarInfo, useSave } from '../hooks/save/useSave'
import type { AllChainsNonFungibleToken } from '../types'

const useStyles = makeStyles()((theme) => ({
    actions: {
        padding: 16,
        boxShadow: `0 0 20px ${parseColor(theme.palette.maskColor.highlight).setAlpha(0.2).toRgbString()}`,
        backdropFilter: 'blur(16px)',
    },
    cancel: {
        backgroundColor: theme.palette.background.default,
        color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#111418',
        border: 'none',
        '&:hover': {
            border: 'none',
        },
    },
    content: {
        margin: 0,
        padding: 16,
        '::-webkit-scrollbar': {
            display: 'none',
        },
        textAlign: 'center',
    },
}))

interface UploadBackgroundDialogProps {
    account?: string
    isBindAccount?: boolean
    image?: string | File
    token?: AllChainsNonFungibleToken
    proof?: BindingProof
    pluginId?: NetworkPluginID
    onBack: () => void
    onClose: () => void
}

async function uploadBackground(blob: Blob, userId: string): Promise<AvatarInfo | undefined> {
    try {
        const media = await Twitter.uploadUserAvatar(userId, blob)
        const data = await Twitter.updateProfileBanner(userId, media.media_id_string)
        if (!data) {
            return
        }
        const avatarId = getAvatarId(data?.imageUrl ?? '')
        return { ...data, avatarId }
    } catch (err) {
        return
    }
}

export function UploadBackgroundDialog(props: UploadBackgroundDialogProps) {
    const { image, account, token, onClose, onBack, proof, isBindAccount = false, pluginId } = props
    const currentPluginId = useCurrentWeb3NetworkPluginID(pluginId)
    const { classes } = useStyles()
    const identifier = useSubscription(context.currentVisitingProfile)
    const [editor, setEditor] = useState<AvatarEditor | null>(null)
    const [scale, setScale] = useState(1)
    const { showSnackbar } = useCustomSnackbar()
    const [disabled, setDisabled] = useState(false)
    const { currentPersona } = usePersonaConnectStatus()
    const t = useI18N()

    const [state, setState] = useState({
        allowZoomOut: false,
        position: { x: 0.5, y: 0.5 },
        scale: 1,
        rotate: 0,
        borderRadius: 0,
        preview: null,
        width: 508,
        height: 185,
    })

    const [, saveAvatar] = useSave(currentPluginId, (token?.chainId ?? ChainId.Mainnet) as ChainId)

    const onSave = useCallback(async () => {
        if (!editor || !account || !token || !currentPersona?.identifier || !proof) return
        editor.getImage().toBlob(async (blob) => {
            if (!blob) return
            setDisabled(true)
            const avatarData = await uploadBackground(blob, proof.identity)
            if (!avatarData) {
                setDisabled(false)
                return
            }
            // const response = await saveAvatar(
            //     account,
            //     isBindAccount,
            //     token,
            //     avatarData,
            //     currentPersona.identifier,
            //     proof,
            // )
            // if (!response) {
            //     showSnackbar(t.upload_avatar_failed_message(), { variant: 'error' })
            //     setDisabled(false)
            //     return
            // }
            showSnackbar(t.upload_avatar_success_message(), { variant: 'success' })
            location.reload()
            onClose()
            setDisabled(false)
        }, 'image/png')
    }, [account, editor, identifier, onClose, currentPersona, proof, isBindAccount, saveAvatar])

    if (!account || !image || !token || !proof) return null

    return (
        <>
            <DialogContent className={classes.content}>
                <AvatarEditor
                    ref={(e) => setEditor(e)}
                    image={image!}
                    scale={scale ?? 1}
                    rotate={0}
                    border={50}
                    // scale={state.scale}
                    width={state.width}
                    height={state.height}
                    // position={state.position}
                    // rotate={state.rotate}
                    borderRadius={state.width / (100 / state.borderRadius)}
                    className="editor-canvas"
                />
                <Slider
                    disabled={disabled}
                    max={2}
                    min={0.5}
                    step={0.1}
                    defaultValue={1}
                    onChange={(_, value) => setScale(value as number)}
                    aria-label="Scale"
                    sx={{
                        color: (theme) => theme.palette.maskColor.primary,
                        '& .MuiSlider-thumb': {
                            width: 12,
                            height: 12,
                            backgroundColor: (theme) => theme.palette.maskColor.primary,
                        },
                        '& .MuiSlider-rail': {
                            opacity: 0.5,
                            backgroundColor: (theme) => theme.palette.maskColor.dark,
                        },
                    }}
                />
            </DialogContent>
            <DialogActions className={classes.actions}>
                <Button disabled={disabled} className={classes.cancel} fullWidth variant="outlined" onClick={onBack}>
                    {t.cancel()}
                </Button>
                <Button fullWidth onClick={onSave} disabled={disabled}>
                    {t.save()}
                </Button>
            </DialogActions>
        </>
    )
}
