import { createInjectHooksRenderer, useActivatedPluginsSNSAdaptor } from '@masknet/plugin-infra/content-script'
import { useSocialAddressListAll } from '@masknet/plugin-infra/web3'
import type { Plugin } from '@masknet/plugin-infra'
import { EMPTY_LIST } from '@masknet/shared-base'
import { makeStyles, useStylesExtends } from '@masknet/theme'
import type { SocialIdentity } from '@masknet/web3-shared-base'
import { useMemo } from 'react'

const useStyles = makeStyles()(() => ({
    root: {},
}))

export interface AvatarProps extends withClasses<'root'> {
    identity: SocialIdentity
    sourceType?: Plugin.SNSAdaptor.AvatarRealmSourceType
}

export function Avatar(props: AvatarProps) {
    const { identity, sourceType } = props
    const classes = useStylesExtends(useStyles(), props)

    const { value: socialAddressList = EMPTY_LIST, loading: loadingSocialAddressList } =
        useSocialAddressListAll(identity)

    const component = useMemo(() => {
        const Component = createInjectHooksRenderer(
            useActivatedPluginsSNSAdaptor.visibility.useNotMinimalMode,
            (plugin) => {
                const shouldDisplay =
                    plugin.AvatarRealm?.Utils?.shouldDisplay?.(identity, socialAddressList, sourceType) ?? true
                return shouldDisplay ? plugin.AvatarRealm?.UI?.Decorator : undefined
            },
        )

        return <Component identity={identity} socialAddressList={socialAddressList} />
    }, [identity, socialAddressList, sourceType])

    if (loadingSocialAddressList || !component) return null
    return <div className={classes.root}>{component}</div>
}
