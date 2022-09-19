import { useCallback, useEffect, useState } from 'react'
import { NFTListDialog } from './NFTListDialog'
import { InjectedDialog } from '@masknet/shared'
import { UploadAvatarDialog } from './UploadAvatarDialog'
import { UploadBackgroundDialog } from './UploadBackgroundDialog'
import { BindingProof, CrossIsolationMessages } from '@masknet/shared-base'
import { useAccount } from '@masknet/plugin-infra/web3'
import { AllChainsNonFungibleToken, PFP_TYPE, SelectTokenInfo } from '../types'
import { PersonaPage } from './PersonaPage'
import { DialogContent } from '@mui/material'
import { useI18N } from '../locales/i18n_generated'
import { isSameAddress } from '@masknet/web3-shared-base'
import { makeStyles, useTabs } from '@masknet/theme'
import { TabContext } from '@mui/lab'
import { PluginId } from '@masknet/plugin-infra'
import * as React from 'react'
import { styled } from '@mui/material/styles'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

const useStyles = makeStyles()((theme) => ({
    root: {
        margin: 0,
        padding: '0px !important',
        '::-webkit-scrollbar': {
            display: 'none',
        },
    },
}))
enum CreateNFTAvatarStep {
    Persona = 'persona',
    NFTList = 'NFTList',
    UploadAvatar = 'UploadAvatar',
    UploadBackground = 'UploadBackground',
}

interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
}

const ProfileTabs = styled(Tabs)(({ theme }) => ({
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    '& .MuiTabs-indicator': {
        backgroundColor: '#00000000',
    },
}))

const ProfileTab = styled((props: StyledTabProps) => <Tab disableRipple {...props} />)(({ theme }) => ({
    textTransform: 'none',
    minWidth: 0,
    margin: '7px',
    [theme.breakpoints.up('sm')]: {
        minWidth: 0,
    },
    borderBottom: 0,
    fontWeight: 700,
    fontSize: 16,
    color: '#767F8D',
    fontFamily: ['Helvetica', '-apple-system'].join(','),
    '&.Mui-selected': {
        boxShadow: '0px -5px 5px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px 12px 0px 0px',
        background: '#ffffff',
        color: '#000000',
    },
    '&.Mui-focusVisible': {
        // backgroundColor: '#d1eaff',
    },
}))

interface StyledTabProps {
    label: string
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}>
            {value === index && <Typography>{children}</Typography>}
        </div>
    )
}

function a11yProps(index: number) {
    return {
        id: `tab-${index}`,
        'aria-controls': `tabpanel-${index}`,
    }
}

export function NFTAvatarDialog() {
    const [open, setOpen] = useState(false)
    const account = useAccount()
    const [step, setStep] = useState(CreateNFTAvatarStep.Persona)
    const [wallets, setWallets] = useState<BindingProof[]>()

    const [selectedAccount, setSelectedAccount] = useState((account || wallets?.[0]?.identity) ?? '')
    const [selectedTokenInfo, setSelectedTokenInfo] = useState<SelectTokenInfo>()
    const [tokenInfo, setTokenInfo] = useState<AllChainsNonFungibleToken>()
    const [proof, setProof] = useState<BindingProof>()
    const t = useI18N()
    const { classes } = useStyles()
    const [tabIndex, setTabIndex] = React.useState(0)

    useEffect(() => {
        return CrossIsolationMessages.events.requestOpenApplication.on(({ open, application }) => {
            if (application !== PluginId.Avatar) return
            setOpen(open)
        })
    }, [])

    const handleClose = () => setOpen(false)

    const onPersonaChange = (proof: BindingProof, wallets?: BindingProof[], tokenInfo?: AllChainsNonFungibleToken) => {
        setWallets(wallets)
        setTokenInfo(tokenInfo)
        setProof(proof)
    }

    const onSelected = (info: SelectTokenInfo) => {
        setSelectedTokenInfo(info)
    }

    const onNext = useCallback(() => {
        if (step === CreateNFTAvatarStep.Persona) setStep(CreateNFTAvatarStep.NFTList)
        else if (step === CreateNFTAvatarStep.NFTList) {
            console.log('now value', tabIndex)
            if (tabIndex === 0) {
                setStep(CreateNFTAvatarStep.UploadAvatar)
            } else {
                setStep(CreateNFTAvatarStep.UploadBackground)
            }
        }
    }, [step, tabIndex])

    const onBack = useCallback(() => {
        if (step === CreateNFTAvatarStep.UploadAvatar || step === CreateNFTAvatarStep.UploadBackground)
            setStep(CreateNFTAvatarStep.NFTList)
        else if (step === CreateNFTAvatarStep.NFTList) setStep(CreateNFTAvatarStep.Persona)
        else handleClose()
    }, [step])

    const onClose = useCallback(() => {
        setStep(CreateNFTAvatarStep.Persona)
        handleClose()
    }, [handleClose])

    useEffect(() => setSelectedAccount(account || wallets?.[0]?.identity || ''), [account, wallets?.[0]?.identity])

    const onTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue)
    }

    /** hidden background page **/
    const [currentTab, onChange, tabs] = useTabs(PFP_TYPE.PFP /* , PFP_TYPE.BACKGROUND */)
    return (
        <TabContext value={currentTab}>
            <InjectedDialog
                title={
                    step === CreateNFTAvatarStep.UploadAvatar
                        ? t.application_edit_profile_dialog_title()
                        : t.application_dialog_title()
                }
                isOnBack={step !== CreateNFTAvatarStep.Persona}
                open={open}
                onClose={onBack}>
                <DialogContent className={classes.root}>
                    {step === CreateNFTAvatarStep.Persona ? (
                        <PersonaPage onClose={onClose} onNext={onNext} onChange={onPersonaChange} />
                    ) : null}
                    {step === CreateNFTAvatarStep.NFTList ? (
                        <Box>
                            <ProfileTabs value={tabIndex} onChange={onTabChange} variant="fullWidth">
                                <ProfileTab label="NFT PFP" {...a11yProps(0)} />
                                <ProfileTab label="NFT Background" {...a11yProps(1)} />
                            </ProfileTabs>

                            <TabPanel value={tabIndex} index={0}>
                                <NFTListDialog
                                    tokenInfo={tokenInfo}
                                    wallets={wallets}
                                    onNext={onNext}
                                    onSelected={onSelected}
                                    pfpType={PFP_TYPE.PFP}
                                    selectedAccount={selectedAccount}
                                    setSelectedAccount={setSelectedAccount}
                                />
                            </TabPanel>
                            <TabPanel value={tabIndex} index={1}>
                                <NFTListDialog
                                    tokenInfo={tokenInfo}
                                    wallets={wallets}
                                    onNext={onNext}
                                    onSelected={onSelected}
                                    pfpType={PFP_TYPE.BACKGROUND}
                                    selectedAccount={selectedAccount}
                                    setSelectedAccount={setSelectedAccount}
                                />
                            </TabPanel>
                        </Box>
                    ) : null}
                    {step === CreateNFTAvatarStep.UploadAvatar ? (
                        <UploadAvatarDialog
                            proof={proof}
                            isBindAccount={wallets?.some((x) => isSameAddress(x.identity, selectedTokenInfo?.account))}
                            account={selectedTokenInfo?.account}
                            image={selectedTokenInfo?.image}
                            token={selectedTokenInfo?.token}
                            pluginId={selectedTokenInfo?.pluginId}
                            onBack={onBack}
                            onClose={onClose}
                        />
                    ) : null}
                    {step === CreateNFTAvatarStep.UploadBackground ? (
                        <UploadBackgroundDialog
                            proof={proof}
                            isBindAccount={wallets?.some((x) => isSameAddress(x.identity, selectedTokenInfo?.account))}
                            account={selectedTokenInfo?.account}
                            image={selectedTokenInfo?.image}
                            token={selectedTokenInfo?.token}
                            pluginId={selectedTokenInfo?.pluginId}
                            onBack={onBack}
                            onClose={onClose}
                        />
                    ) : null}
                </DialogContent>
            </InjectedDialog>
        </TabContext>
    )
}
