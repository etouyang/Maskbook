import { Icons } from '@masknet/icons'
import { PluginId } from '@masknet/plugin-infra'
import { WalletMessages } from '@masknet/plugin-wallet'
import { useRemoteControlledDialog } from '@masknet/shared-base-ui'
import { makeStyles } from '@masknet/theme'
import { NetworkPluginID, SocialAddress, SocialAddressType, SocialIdentity } from '@masknet/web3-shared-base'
import { FC, HTMLProps, useMemo } from 'react'
import { TipButton } from '../../../plugins/Tips/components'
import type { TipAccount } from '../../../plugins/Tips/types'
import { ProfileBar } from './ProfileBar'

const useStyles = makeStyles()((theme) => {
    return {
        title: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        profileBar: {
            overflow: 'auto',
        },
        settingItem: {
            display: 'flex',
            alignItems: 'center',
        },
        gearIcon: {
            color: theme.palette.text.primary,
            cursor: 'pointer',
        },
        tipButton: {
            width: 40,
            height: 40,
            borderRadius: 40,
            border: `1px solid ${theme.palette.maskColor.line}`,
        },
    }
})

interface Props extends HTMLProps<HTMLDivElement> {
    identity: SocialIdentity
    socialAddressList: Array<SocialAddress<NetworkPluginID>>
    address?: string
    onAddressChange?(address: string): void
}
export const ProfileCardTitle: FC<Props> = ({
    className,
    socialAddressList,
    address,
    identity,
    onAddressChange,
    ...rest
}) => {
    const { classes, cx } = useStyles()
    const { setDialog } = useRemoteControlledDialog(WalletMessages.events.ApplicationDialogUpdated)
    const handleOpenDialog = () => {
        setDialog({
            open: true,
            settings: {
                quickMode: true,
                switchTab: {
                    focusPluginId: PluginId.Web3ProfileCard,
                },
            },
        })
    }
    const tipAccounts: TipAccount[] = useMemo(() => {
        return socialAddressList.map((x) => ({
            address: x.address,
            name: x.label,
            verified: x.type === SocialAddressType.NEXT_ID,
        }))
    }, [socialAddressList])

    return (
        <div className={cx(classes.title, className)} {...rest}>
            <ProfileBar
                className={classes.profileBar}
                identity={identity}
                socialAddressList={socialAddressList}
                address={address}
                onAddressChange={onAddressChange}
            />
            <div className={classes.settingItem}>
                {identity.isOwner ? (
                    <Icons.Gear onClick={handleOpenDialog} className={classes.gearIcon} />
                ) : (
                    <TipButton className={classes.tipButton} receiver={identity.identifier} addresses={tipAccounts} />
                )}
            </div>
        </div>
    )
}
