import { Icons } from '@masknet/icons'
import { useChainId, useWeb3State } from '@masknet/plugin-infra/web3'
import { AddressItem, useSnackbarCallback } from '@masknet/shared'
import { makeStyles, ShadowRootMenu } from '@masknet/theme'
import {
    isSameAddress,
    NetworkPluginID,
    SocialAddress,
    SocialAddressType,
    SocialIdentity,
} from '@masknet/web3-shared-base'
import { ChainId } from '@masknet/web3-shared-evm'
import { Box, Link, MenuItem, Typography } from '@mui/material'
import { HTMLProps, memo, useRef, useState } from 'react'
import { useCopyToClipboard } from 'react-use'
import { useI18N } from '../../../utils'

const MENU_ITEM_HEIGHT = 40
const MENU_LIST_PADDING = 8
const useStyles = makeStyles()((theme) => ({
    root: {
        display: 'flex',
        alignItems: 'center',
        columnGap: 4,
        cursor: 'pointer',
    },
    avatar: {
        height: 40,
        width: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 40,
        filter: 'drop-shadow(0px 6px 12px rgba(28, 104, 243, 0.2))',
        backdropFilter: 'blur(16px)',
    },
    description: {
        height: 40,
        marginLeft: 10,
        overflow: 'auto',
    },
    nickname: {
        color: theme.palette.text.primary,
        fontWeight: 700,
        fontSize: 18,
        lineHeight: '22px',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
    },
    addressRow: {
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        columnGap: 2,
    },
    address: {
        color: theme.palette.text.primary,
        fontSize: 14,
        height: 18,
        lineHeight: '18px',
    },
    linkIcon: {
        lineHeight: '14px',
        height: 14,
        overflow: 'hidden',
        color: theme.palette.text.secondary,
        cursor: 'pointer',
    },
    addressMenu: {
        maxHeight: MENU_ITEM_HEIGHT * 10 + MENU_LIST_PADDING * 2,
        width: 248,
        backgroundColor: theme.palette.maskColor.bottom,
    },
    menuItem: {
        height: MENU_ITEM_HEIGHT,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        flexGrow: 1,
        justifyContent: 'space-between',
    },
    addressItem: {
        display: 'flex',
        alignItems: 'center',
    },
    secondLinkIcon: {
        margin: '4px 2px 0 2px',
        color: theme.palette.maskColor.secondaryDark,
    },
    selectedIcon: {
        color: theme.palette.maskColor.primary,
    },
}))

export interface ProfileBarProps extends HTMLProps<HTMLDivElement> {
    identity: SocialIdentity
    socialAddressList: Array<SocialAddress<NetworkPluginID>>
    address?: string
    onAddressChange?: (address: string) => void
}

/**
 * What a Profile includes:
 * - SNS info
 * - Wallets
 */
export const ProfileBar = memo<ProfileBarProps>(
    ({ socialAddressList, address, identity, onAddressChange, className, ...rest }) => {
        const { classes, theme, cx } = useStyles()
        const { t } = useI18N()
        const containerRef = useRef<HTMLDivElement>(null)

        const [, copyToClipboard] = useCopyToClipboard()

        const onCopy = useSnackbarCallback({
            executor: async () => copyToClipboard(address!),
            deps: [],
            successText: t('copy_success'),
        })

        const { Others } = useWeb3State(NetworkPluginID.PLUGIN_EVM)

        const [walletMenuOpen, setWalletMenuOpen] = useState(false)
        const chainId = useChainId(NetworkPluginID.PLUGIN_EVM)
        const selectedAddress = socialAddressList.find((x) => isSameAddress(x.address, address))

        return (
            <Box className={cx(classes.root, className)} {...rest} ref={containerRef}>
                <img src={identity.avatar} alt={identity.nickname} className={classes.avatar} />
                <Box className={classes.description}>
                    <Typography className={classes.nickname} title={identity.nickname}>
                        {identity.nickname}
                    </Typography>
                    {address ? (
                        <div className={classes.addressRow}>
                            <AddressItem
                                socialAddress={selectedAddress}
                                disableLinkIcon
                                TypographyProps={{ className: classes.address }}
                            />
                            <Icons.PopupCopy onClick={onCopy} size={14} className={classes.linkIcon} />
                            <Link
                                href={Others?.explorerResolver.addressLink(chainId ?? ChainId.Mainnet, address)}
                                target="_blank"
                                title={t('view_on_explorer')}
                                rel="noopener noreferrer"
                                onClick={(event) => {
                                    event.stopPropagation()
                                }}
                                className={classes.linkIcon}>
                                <Icons.LinkOut size={14} />
                            </Link>
                            <Icons.ArrowDrop
                                size={14}
                                color={theme.palette.text.primary}
                                onClick={() => setWalletMenuOpen((v) => !v)}
                            />
                        </div>
                    ) : null}
                </Box>
                <ShadowRootMenu
                    anchorEl={containerRef.current}
                    open={walletMenuOpen}
                    disablePortal
                    PaperProps={{
                        className: classes.addressMenu,
                    }}
                    onClose={() => setWalletMenuOpen(false)}>
                    {socialAddressList.map((x) => {
                        return (
                            <MenuItem
                                className={classes.menuItem}
                                key={x.address}
                                value={x.address}
                                onClick={() => {
                                    setWalletMenuOpen(false)
                                    onAddressChange?.(x.address)
                                }}>
                                <div className={classes.addressItem}>
                                    <AddressItem socialAddress={x} linkIconClassName={classes.secondLinkIcon} />
                                    {x.type === SocialAddressType.NEXT_ID && <Icons.Verified />}
                                </div>
                                {isSameAddress(address, x.address) && (
                                    <Icons.CheckCircle className={classes.selectedIcon} />
                                )}
                            </MenuItem>
                        )
                    })}
                </ShadowRootMenu>
            </Box>
        )
    },
)
