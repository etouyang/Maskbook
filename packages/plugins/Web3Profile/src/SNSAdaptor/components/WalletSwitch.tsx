import { makeStyles } from '@masknet/theme'
import { Link, styled, Switch, SwitchProps, Typography } from '@mui/material'
import { FormattedAddress, PersonaImageIcon, WalletTypes } from '@masknet/shared'
import { useI18N } from '../../locales'
import { useState } from 'react'
import { ChainId, explorerResolver, NETWORK_DESCRIPTORS } from '@masknet/web3-shared-evm'
import { Icons } from '@masknet/icons'
import { isSameAddress, NetworkPluginID } from '@masknet/web3-shared-base'
import { useWeb3State } from '@masknet/plugin-infra/web3'

const useStyles = makeStyles()((theme) => ({
    currentAccount: {
        padding: '8px',
        display: 'flex',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.05)',
    },
    accountInfo: {
        fontSize: 16,
        flexGrow: 1,
        marginLeft: theme.spacing(1),
    },
    infoRow: {
        display: 'flex',
        alignItems: 'center',
    },
    accountName: {
        fontSize: 14,
        fontWeight: 700,
    },
    address: {
        fontSize: 12,
        fontWeight: 400,
        color: theme.palette.text.secondary,
        display: 'inline-block',
    },
    link: {
        color: theme.palette.text.primary,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
    },
    linkIcon: {
        color: theme.palette.maskColor.second,
        height: 15,
        width: 15,
        marginTop: '1px',
    },
}))

const IOSSwitch = styled((props: SwitchProps) => (
    <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
    width: 43,
    height: 22,
    padding: 0,
    '& .MuiSwitch-switchBase': {
        padding: 0,
        margin: 3.5,
        transitionDuration: '300ms',
        '&.Mui-checked': {
            transform: 'translateX(22px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
                backgroundColor: theme.palette.mode === 'dark' ? '#2ECA45' : '#65C466',
                opacity: 1,
                border: 0,
            },
            '&.Mui-disabled + .MuiSwitch-track': {
                opacity: 0.5,
            },
        },
        '&.Mui-focusVisible .MuiSwitch-thumb': {
            color: '#33cf4d',
            border: '6px solid #fff',
        },
        '&.Mui-disabled .MuiSwitch-thumb': {
            color: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[600],
        },
        '&.Mui-disabled + .MuiSwitch-track': {
            opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
        },
    },
    '& .MuiSwitch-thumb': {
        boxSizing: 'border-box',
        width: 14,
        height: 14,
    },
    '& .MuiSwitch-track': {
        borderRadius: 26 / 2,
        backgroundColor: theme.palette.mode === 'light' ? '#E9E9EA' : '#39393D',
        opacity: 1,
        transition: theme.transitions.create(['background-color'], {
            duration: 500,
        }),
    },
}))

interface WalletSwitchProps {
    type: number
    address: WalletTypes
    isPublic: boolean
    hiddenItems?: WalletTypes[]
    setHiddenItems: (items: WalletTypes[]) => void
}

export function WalletSwitch({ type, address, isPublic, hiddenItems = [], setHiddenItems }: WalletSwitchProps) {
    const { classes } = useStyles()
    const t = useI18N()
    const [checked, setChecked] = useState(!!isPublic)
    const getWalletName = () => {
        return [t.EVM_wallet(), t.Solana_wallet(), t.Flow_wallet()][type]
    }

    const iconURL = NETWORK_DESCRIPTORS.find((network) => network?.chainId === ChainId.Mainnet)?.icon

    const { Others } = useWeb3State(address?.platform ?? NetworkPluginID.PLUGIN_EVM)

    const onSwitch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.checked
        if (!v) {
            setHiddenItems([...hiddenItems, address])
        } else {
            const preItems = [...hiddenItems]
            setHiddenItems(preItems?.filter((item) => !isSameAddress(item?.address, address?.address)))
        }
        setChecked(v)
    }
    return (
        <div className={classes.currentAccount}>
            <PersonaImageIcon icon={iconURL} size={30} borderRadius="99px" />
            <div className={classes.accountInfo}>
                <div className={classes.infoRow}>
                    <Typography className={classes.accountName}>{getWalletName()}</Typography>
                </div>
                <div className={classes.infoRow}>
                    <Typography className={classes.address} variant="body2" title={address?.address}>
                        <FormattedAddress address={address?.address} size={4} formatter={Others?.formatAddress} />
                    </Typography>

                    <Link
                        className={classes.link}
                        href={explorerResolver.addressLink(ChainId.Mainnet, address.address) ?? ''}
                        target="_blank"
                        title={t.plugin_wallet_view_on_explorer()}
                        rel="noopener noreferrer">
                        <Icons.LinkOut className={classes.linkIcon} />
                    </Link>
                </div>
            </div>
            <div>
                <IOSSwitch checked={checked} onChange={onSwitch} />
            </div>
        </div>
    )
}
