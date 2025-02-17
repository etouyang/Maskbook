import { useCallback, useState } from 'react'
import { NetworkPluginID } from '@masknet/web3-shared-base'
import { useCompositionContext } from '@masknet/plugin-infra/content-script'
import { useAccount, useChainId, useWeb3Connection } from '@masknet/plugin-infra/web3'
import { InjectedDialog } from '@masknet/shared'
import { useRemoteControlledDialog } from '@masknet/shared-base-ui'
import { makeStyles, MaskTabList, useTabs } from '@masknet/theme'
import { DialogContent, Tab } from '@mui/material'
import Web3Utils from 'web3-utils'
import {
    useCurrentIdentity,
    useCurrentLinkedPersona,
    useLastRecognizedIdentity,
} from '../../../components/DataSource/useActivatedUI'
import { useI18N } from '../locales'
import { useI18N as useBaseI18N } from '../../../utils'
import { WalletMessages } from '../../Wallet/messages'
import { RedPacketMetaKey } from '../constants'
import { DialogTabs, RedPacketJSONPayload } from '../types'
import type { RedPacketSettings } from './hooks/useCreateCallback'
import { RedPacketConfirmDialog } from './RedPacketConfirmDialog'
import { RedPacketPast } from './RedPacketPast'
import { TabContext, TabPanel } from '@mui/lab'
import { Icons } from '@masknet/icons'
import { RedPacketERC20Form } from './RedPacketERC20Form'
import { RedPacketERC721Form } from './RedPacketERC721Form'

const useStyles = makeStyles()((theme) => ({
    content: {
        position: 'relative',
        paddingTop: 50,
    },
    tabs: {
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    dialogContent: {
        padding: 0,
        '::-webkit-scrollbar': {
            display: 'none',
        },

        overflowX: 'hidden',
    },
    tabPaper: {
        position: 'sticky',
        top: 0,
        zIndex: 5000,
    },
    indicator: {
        display: 'none',
    },
    tab: {
        maxWidth: 120,
    },
    focusTab: {
        borderBottom: `2px solid ${theme.palette.primary.main}`,
    },
    flexContainer: {
        justifyContent: 'space-around',
    },
    labelWrapper: {
        display: 'flex',
    },
    img: {
        width: 20,
        marginRight: 4,
    },
}))

enum CreateRedPacketPageStep {
    NewRedPacketPage = 'new',
    ConfirmPage = 'confirm',
}

interface RedPacketDialogProps extends withClasses<never> {
    open: boolean
    onClose: () => void
    isOpenFromApplicationBoard?: boolean
}

export default function RedPacketDialog(props: RedPacketDialogProps) {
    const t = useI18N()
    const { t: i18n } = useBaseI18N()
    const [showHistory, setShowHistory] = useState(false)
    const [step, setStep] = useState(CreateRedPacketPageStep.NewRedPacketPage)
    const { classes } = useStyles()
    const { attachMetadata, dropMetadata } = useCompositionContext()
    const state = useState(DialogTabs.create)
    const [isNFTRedPacketLoaded, setIsNFTRedPacketLoaded] = useState(false)
    const connection = useWeb3Connection(NetworkPluginID.PLUGIN_EVM)
    const chainId = useChainId(NetworkPluginID.PLUGIN_EVM)
    const account = useAccount(NetworkPluginID.PLUGIN_EVM)
    // #region token lucky drop
    const [settings, setSettings] = useState<RedPacketSettings>()
    // #endregion
    // #region nft lucky drop
    const [openNFTConfirmDialog, setOpenNFTConfirmDialog] = useState(false)
    const [openSelectNFTDialog, setOpenSelectNFTDialog] = useState(false)
    // #endregion

    const onClose = useCallback(() => {
        setStep(CreateRedPacketPageStep.NewRedPacketPage)
        setSettings(undefined)
        const [, setValue] = state
        setValue(DialogTabs.create)
        props.onClose()
    }, [props, state, step])

    const currentIdentity = useCurrentIdentity()
    const lastRecognized = useLastRecognizedIdentity()
    const { value: linkedPersona } = useCurrentLinkedPersona()
    const senderName =
        lastRecognized.identifier?.userId ?? currentIdentity?.identifier.userId ?? linkedPersona?.nickname
    const { closeDialog: closeApplicationBoardDialog } = useRemoteControlledDialog(
        WalletMessages.events.ApplicationDialogUpdated,
    )
    const onCreateOrSelect = useCallback(
        async (payload: RedPacketJSONPayload) => {
            if (payload.password === '') {
                if (payload.contract_version === 1) {
                    alert('Unable to share a lucky drop without a password. But you can still withdraw the lucky drop.')
                    payload.password = prompt('Please enter the password of the lucky drop:', '') ?? ''
                } else if (payload.contract_version > 1 && payload.contract_version < 4) {
                    // just sign out the password if it is lost.
                    if (!connection) return
                    payload.password = await connection.signMessage(
                        Web3Utils.sha3(payload.sender.message) ?? '',
                        'personalSign',
                        { account },
                    )
                    payload.password = payload.password!.slice(2)
                }
            }

            if (payload) {
                senderName && (payload.sender.name = senderName)
                attachMetadata(RedPacketMetaKey, payload)
            } else dropMetadata(RedPacketMetaKey)
            onClose()
            closeApplicationBoardDialog()
        },
        [onClose, chainId, senderName, connection],
    )

    const onBack = useCallback(() => {
        if (step === CreateRedPacketPageStep.ConfirmPage) setStep(CreateRedPacketPageStep.NewRedPacketPage)
        if (step === CreateRedPacketPageStep.NewRedPacketPage) onClose()
    }, [step])
    const onNext = useCallback(() => {
        if (step === CreateRedPacketPageStep.NewRedPacketPage) setStep(CreateRedPacketPageStep.ConfirmPage)
    }, [step])
    const onDialogClose = useCallback(() => {
        openSelectNFTDialog
            ? setOpenSelectNFTDialog(false)
            : openNFTConfirmDialog
            ? setOpenNFTConfirmDialog(false)
            : showHistory
            ? setShowHistory(false)
            : onBack()
    }, [showHistory, openNFTConfirmDialog, openSelectNFTDialog, onBack])

    const _onChange = useCallback((val: Omit<RedPacketSettings, 'password'>) => {
        setSettings(val)
    }, [])

    const handleCreated = useCallback(
        (payload: RedPacketJSONPayload) => {
            onCreateOrSelect(payload)
            setSettings(undefined)
        },
        [onCreateOrSelect],
    )

    const isCreateStep = step === CreateRedPacketPageStep.NewRedPacketPage
    const title = openSelectNFTDialog
        ? t.nft_select_collection()
        : openNFTConfirmDialog
        ? i18n('confirm')
        : isCreateStep
        ? t.display_name()
        : t.details()
    const [currentTab, onChange, tabs] = useTabs('tokens', 'collectibles')

    return (
        <TabContext value={currentTab}>
            <InjectedDialog
                isOpenFromApplicationBoard={props.isOpenFromApplicationBoard}
                open={props.open}
                title={title}
                titleTail={
                    step === CreateRedPacketPageStep.NewRedPacketPage && !showHistory ? (
                        <Icons.History onClick={() => setShowHistory((history) => !history)} />
                    ) : null
                }
                titleTabs={
                    step === CreateRedPacketPageStep.NewRedPacketPage ? (
                        <MaskTabList variant="base" onChange={onChange} aria-label="Redpacket">
                            <Tab label={t.erc20_tab_title()} value={tabs.tokens} />
                            <Tab label={t.erc721_tab_title()} value={tabs.collectibles} />
                        </MaskTabList>
                    ) : null
                }
                onClose={onDialogClose}
                isOnBack={showHistory || step !== CreateRedPacketPageStep.NewRedPacketPage}
                disableTitleBorder>
                <DialogContent className={classes.dialogContent}>
                    {step === CreateRedPacketPageStep.NewRedPacketPage ? (
                        <>
                            <div
                                style={{
                                    visibility: showHistory ? 'hidden' : 'visible',
                                    ...(showHistory ? { display: 'none' } : {}),
                                    height: showHistory
                                        ? 0
                                        : currentTab === 'collectibles' && isNFTRedPacketLoaded
                                        ? 'calc(100% + 84px)'
                                        : 'auto',
                                }}>
                                <TabPanel value={tabs.tokens} style={{ padding: 0 }}>
                                    <RedPacketERC20Form
                                        origin={settings}
                                        onClose={onClose}
                                        onNext={onNext}
                                        onChange={_onChange}
                                    />
                                </TabPanel>
                                <TabPanel value={tabs.collectibles} style={{ padding: 0 }}>
                                    <RedPacketERC721Form
                                        openSelectNFTDialog={openSelectNFTDialog}
                                        setOpenSelectNFTDialog={setOpenSelectNFTDialog}
                                        setOpenNFTConfirmDialog={setOpenNFTConfirmDialog}
                                        openNFTConfirmDialog={openNFTConfirmDialog}
                                        onClose={onClose}
                                        setIsNFTRedPacketLoaded={setIsNFTRedPacketLoaded}
                                    />
                                </TabPanel>
                            </div>
                            {showHistory ? (
                                <RedPacketPast tabs={tabs} onSelect={onCreateOrSelect} onClose={onClose} />
                            ) : null}
                        </>
                    ) : null}

                    {step === CreateRedPacketPageStep.ConfirmPage ? (
                        <RedPacketConfirmDialog
                            onClose={onClose}
                            onBack={onBack}
                            onCreated={handleCreated}
                            settings={settings}
                        />
                    ) : null}
                </DialogContent>
            </InjectedDialog>
        </TabContext>
    )
}
