import { WalletMessages } from '@masknet/plugin-wallet'
import { useRemoteControlledDialog } from '@masknet/shared-base-ui'
import { Box, Button, Divider, ListItemIcon, MenuItem, Typography } from '@mui/material'
import { memo, PropsWithChildren, useCallback, useMemo, useState } from 'react'
import { useI18N } from '../../i18n-next-ui'
import { Action } from './Action'
import { useStatusBarStyles } from './styles'
import { BindingProof, PopupRoutes } from '@masknet/shared-base'
import {
    useAccount,
    useCurrentWeb3NetworkPluginID,
    useChainId,
    useNetworkDescriptor,
    useProviderDescriptor,
    useWeb3State,
    Web3Helper,
    useDefaultChainId,
    useRecentTransactions,
} from '@masknet/plugin-infra/web3'
import { Icons } from '@masknet/icons'
import type { WalletDescriptionProps } from './WalletDescription'
import { first, omit } from 'lodash-unified'
import { useWalletName } from './hooks/useWalletName'
import { WalletDescription } from './WalletDescription'
import {
    isSameAddress,
    NetworkPluginID,
    resolveNextID_NetworkPluginID,
    TransactionStatusType,
} from '@masknet/web3-shared-base'
import { WalletMenuItem } from './WalletMenuItem'
import { useMenu } from '@masknet/shared'
import Services from '../../../extension/service'
import { useUpdateEffect } from 'react-use'

interface PluginVerifiedWalletStatusBarProps extends PropsWithChildren<{}> {
    verifiedWallets: BindingProof[]
    className?: string
    onChange?: (address: string, pluginId: NetworkPluginID, chainId: Web3Helper.ChainIdAll) => void
    expectedAddress: string
}

export const PluginVerifiedWalletStatusBar = memo<PluginVerifiedWalletStatusBarProps>(
    ({ className, children, verifiedWallets, onChange, expectedAddress }) => {
        const { t } = useI18N()

        const account = useAccount()

        const { classes, cx } = useStatusBarStyles()

        const { openDialog: openSelectProviderDialog } = useRemoteControlledDialog(
            WalletMessages.events.selectProviderDialogUpdated,
        )

        const { openDialog: openWalletStatusDialog } = useRemoteControlledDialog(
            WalletMessages.events.walletStatusDialogUpdated,
        )

        const openPopupWindow = useCallback(() => {
            Services.Helper.openPopupWindow(PopupRoutes.ConnectedWallets, {
                internal: true,
            })
        }, [])

        // exclude current account
        const wallets = verifiedWallets.filter((x) => !isSameAddress(x.identity, account))

        const currentPluginId = useCurrentWeb3NetworkPluginID()

        const selectedWallet = wallets.find((x) => isSameAddress(x.identity, expectedAddress))

        const defaultVerifiedWallet = selectedWallet ?? first(wallets)

        // Whether the current account is verified
        const isVerifiedAccount = verifiedWallets.some((x) => isSameAddress(x.identity, account))

        const pluginIdByDefaultVerifiedWallet = defaultVerifiedWallet
            ? resolveNextID_NetworkPluginID(defaultVerifiedWallet?.platform)
            : undefined

        const isNextIdWallet = !account || !isSameAddress(account, expectedAddress)

        const defaultPluginId = isNextIdWallet ? pluginIdByDefaultVerifiedWallet : currentPluginId

        const defaultWalletName = useWalletName(
            isNextIdWallet ? defaultVerifiedWallet?.identity : account,
            defaultPluginId,
            isNextIdWallet,
        )

        const { Others } = useWeb3State(defaultPluginId)
        const chainId = useChainId(defaultPluginId)
        const defaultChainId = useDefaultChainId(defaultPluginId)

        const providerDescriptor = useProviderDescriptor(defaultPluginId)
        const networkDescriptor = useNetworkDescriptor(defaultPluginId)

        const pendingTransactions = useRecentTransactions(currentPluginId, TransactionStatusType.NOT_DEPEND)

        // actual address
        const walletIdentity = !isNextIdWallet ? account : defaultVerifiedWallet?.identity

        const description = useMemo(
            () => ({
                name: defaultWalletName,
                networkIcon: networkDescriptor?.icon,
                providerIcon: !isNextIdWallet ? providerDescriptor?.icon : undefined,
                iconFilterColor: !isNextIdWallet ? providerDescriptor?.iconFilterColor : '',
                formattedAddress: walletIdentity ? Others?.formatAddress(walletIdentity, 4) : '',
                addressLink: walletIdentity
                    ? Others?.explorerResolver.addressLink?.(!isNextIdWallet ? chainId : defaultChainId, walletIdentity)
                    : '',
                address: walletIdentity,
                verified: !isNextIdWallet ? isVerifiedAccount : true,
            }),
            [
                account,
                defaultWalletName,
                providerDescriptor,
                networkDescriptor,
                defaultVerifiedWallet,
                defaultChainId,
                chainId,
                walletIdentity,
            ],
        )

        const [descriptionProps, setDescriptionProps] = useState<WalletDescriptionProps>(description)

        const onSelect = useCallback(
            (props: WalletDescriptionProps, chainId: Web3Helper.ChainIdAll, pluginId: NetworkPluginID) => {
                setDescriptionProps(props)

                if (!props.address) return

                onChange?.(props.address, pluginId, chainId)
            },
            [setDescriptionProps, onChange],
        )

        const [menu, openMenu] = useMenu(
            account ? (
                <WalletMenuItem
                    address={account}
                    verified={isVerifiedAccount}
                    onChangeWallet={openSelectProviderDialog}
                    selected={isSameAddress(descriptionProps.address, account)}
                    onSelect={onSelect}
                />
            ) : (
                <MenuItem key="connect">
                    <Button
                        variant="roundedContained"
                        fullWidth
                        onClick={openSelectProviderDialog}
                        sx={{ minWidth: 311 }}>
                        {t('connect_your_wallet')}
                    </Button>
                </MenuItem>
            ),
            <Divider key="divider" />,
            ...wallets.map((x) => (
                <WalletMenuItem
                    key={x.identity}
                    address={x.identity}
                    verified
                    platform={x.platform}
                    selected={isSameAddress(descriptionProps.address, x.identity)}
                    onSelect={onSelect}
                />
            )),
            <MenuItem key="Wallet Setting" onClick={openPopupWindow}>
                <ListItemIcon>
                    <Icons.WalletSetting size={24} />
                </ListItemIcon>
                <Typography fontSize={14} fontWeight={700}>
                    {t('connected_wallet_settings')}
                </Typography>
            </MenuItem>,
        )

        useUpdateEffect(() => {
            setDescriptionProps(description)
        }, [description])

        if (!account && verifiedWallets.length === 0) {
            return (
                <Box className={cx(classes.root, className)}>
                    <Button fullWidth onClick={openSelectProviderDialog}>
                        <Icons.ConnectWallet className={classes.connection} /> {t('plugin_wallet_connect_a_wallet')}
                    </Button>
                </Box>
            )
        }

        return (
            <>
                <Box className={cx(classes.root, className)}>
                    <WalletDescription
                        {...omit(descriptionProps, 'address')}
                        onClick={openMenu}
                        pending={!!pendingTransactions.length}
                        onPendingClick={openWalletStatusDialog}
                    />
                    <Action openSelectWalletDialog={openSelectProviderDialog}>{children}</Action>
                </Box>
                {menu}
            </>
        )
    },
)
