import { useState } from 'react'
import { useRemoteControlledDialog } from '@masknet/shared'
import { DialogContent } from '@mui/material'
import { PluginPetMessages } from '../messages'
import { InjectedDialog } from '../../../components/shared/InjectedDialog'
import { useI18N } from '../../../utils'
import { PetShareDialog } from './PetShareDialog'
import { PetSetDialog } from './PetSetDialog'

enum PetFriendNFTStep {
    SetFriendNFT = 'set',
    ShareFriendNFT = 'share',
}

export function PetDialog() {
    const { t } = useI18N()
    const { open, closeDialog } = useRemoteControlledDialog(PluginPetMessages.essayDialogUpdated, () => {})
    const [step, setStep] = useState(PetFriendNFTStep.SetFriendNFT)

    const handleConform = () => {
        setStep(PetFriendNFTStep.ShareFriendNFT)
    }

    let timer: NodeJS.Timeout
    const handleClose = () => {
        closeDialog()
        clearTimeout(timer)
        timer = setTimeout(() => {
            setStep(PetFriendNFTStep.SetFriendNFT)
        }, 500)
    }

    return (
        <InjectedDialog
            open={open}
            onClose={handleClose}
            title={t(
                step === PetFriendNFTStep.SetFriendNFT ? 'plugin_pets_dialog_title' : 'plugin_pets_dialog_title_share',
            )}>
            <DialogContent>
                {step === PetFriendNFTStep.SetFriendNFT ? <PetSetDialog onConform={handleConform} /> : null}
                {step === PetFriendNFTStep.ShareFriendNFT ? <PetShareDialog onShare={handleClose} /> : null}
            </DialogContent>
        </InjectedDialog>
    )
}
