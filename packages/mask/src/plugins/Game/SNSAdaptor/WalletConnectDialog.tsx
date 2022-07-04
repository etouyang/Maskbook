import { useState } from 'react'
import { createContainer } from 'unstated-next'
import { useRemoteControlledDialog } from '@masknet/shared-base-ui'
import DialogContent from '@mui/material/DialogContent'
import { useCustomSnackbar } from '@masknet/theme'
import { useAccount, useCurrentWeb3NetworkPluginID } from '@masknet/plugin-infra/web3'
import { NetworkPluginID } from '@masknet/web3-shared-base'
import { InjectedDialog } from '@masknet/shared'
import { PluginGameMessages } from '../messages'
import { WalletStatusBox } from '../../../components/shared/WalletStatusBox'
import GameList from './GameList'
import GameWindow from './GameWindow'
import GameShareDialog from './GameShareDialog'
import { WalletMessages } from '../../Wallet/messages'
import type { GameInfo, GameNFT } from '../types'
import { useI18N } from '../../../utils'

export const ConnectContext = createContainer(() => {
    const [isGameShow, setGameShow] = useState(false)
    const [tokenProps, setTokenProps] = useState<GameNFT>()
    const [gameInfo, setGameInfo] = useState<GameInfo>()

    return {
        isGameShow,
        setGameShow,
        tokenProps,
        setTokenProps,
        gameInfo,
        setGameInfo,
    }
})

const WalletConnectDialog = () => {
    const { t } = useI18N()
    const { showSnackbar } = useCustomSnackbar()
    const account = useAccount(NetworkPluginID.PLUGIN_EVM)
    const currentPluginId = useCurrentWeb3NetworkPluginID()
    const { isGameShow, setGameShow, tokenProps, setTokenProps, gameInfo, setGameInfo } = ConnectContext.useContainer()

    const { open, closeDialog } = useRemoteControlledDialog(PluginGameMessages.events.gameDialogUpdated, (ev) => {
        if (ev?.tokenProps) setTokenProps(ev.tokenProps)
    })

    const { closeDialog: _closeDialog } = useRemoteControlledDialog(WalletMessages.events.ApplicationDialogUpdated)

    const handleGameClose = () => {
        setGameShow(false)
        setGameInfo(undefined)
    }

    const handleGameOpen = (gameInfo: GameInfo) => {
        if (currentPluginId !== NetworkPluginID.PLUGIN_EVM) {
            showSnackbar(t('plugin_game_list_play_evm_error'), { variant: 'error' })
            return
        }
        if (gameInfo.wallet && !account) {
            showSnackbar(t('plugin_game_list_play_error'), { variant: 'error' })
            return
        }
        _closeDialog()
        closeWalletDialog()
        setGameInfo(gameInfo)
        setGameShow(true)
    }

    const { closeDialog: closeWalletDialog } = useRemoteControlledDialog(
        WalletMessages.events.walletStatusDialogUpdated,
    )

    const [isShareShow, setShareShow] = useState(false)
    const handleGameShare = () => setShareShow(true)
    const closeGameShare = () => setShareShow(false)

    if (!open) return null

    return (
        <>
            <InjectedDialog onClose={closeDialog} open={open} title={t('plugin_game_name')}>
                <DialogContent>
                    <WalletStatusBox />
                    <GameList onPlay={handleGameOpen} />
                </DialogContent>
            </InjectedDialog>
            <GameWindow
                gameInfo={gameInfo}
                tokenProps={tokenProps}
                isShow={isGameShow}
                isShadow={isShareShow}
                onClose={handleGameClose}
                onShare={handleGameShare}
            />
            <InjectedDialog onClose={closeGameShare} open={isShareShow} title={t('plugin_game_share_title')}>
                <DialogContent>
                    <GameShareDialog gameInfo={gameInfo} onClose={closeGameShare} />
                </DialogContent>
            </InjectedDialog>
        </>
    )
}

export default WalletConnectDialog
