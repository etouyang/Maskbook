import { LoadingBase, makeStyles } from '@masknet/theme'
import { useMemo } from 'react'
import { CollectibleTab } from '../CollectibleTab'
import { Button, Typography } from '@mui/material'
import { Icons } from '@masknet/icons'
import { CollectibleState } from '../../hooks/useCollectibleState'
import { EMPTY_LIST } from '@masknet/shared-base'
import { NFTActivityCard, ActivityType } from '../../../../components/shared/NFTCard/NFTActivityCard'
import { useI18N } from '../../../../utils'

const useStyles = makeStyles()((theme) => ({
    body: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: 300,
        gap: 12,
        justifyContent: 'center',
    },
    emptyIcon: {
        width: 36,
        height: 36,
    },
    emptyText: {
        fontSize: 14,
        color: theme.palette.maskColor.publicSecond,
    },
}))

const resolveActivityType = (type?: string) => {
    if (!type) return ActivityType.Transfer
    if (['created', 'MINT'].includes(type)) return ActivityType.Mint
    if (['successful'].includes(type)) return ActivityType.Sale
    if (['OFFER', 'offer_entered', 'bid_withdrawn', 'bid_entered'].includes(type)) return ActivityType.Offer
    if (['LIST'].includes(type)) return ActivityType.List
    if (['CANCEL_OFFER'].includes(type)) return ActivityType.CancelOffer
    return ActivityType.Transfer
}

export interface ActivityTabProps {}

export function ActivityTab(props: ActivityTabProps) {
    const { classes } = useStyles()
    const { events } = CollectibleState.useContainer()
    const { t } = useI18N()
    const _events = events.value?.data ?? EMPTY_LIST
    return useMemo(() => {
        if (events.loading)
            return (
                <div className={classes.body}>
                    <LoadingBase />
                </div>
            )
        if (events.error || !events.value)
            return (
                <div className={classes.body}>
                    <Typography className={classes.emptyText}>{t('plugin_furucombo_load_failed')}</Typography>
                    <Button variant="text" onClick={() => events.retry()}>
                        {t('retry')}
                    </Button>
                </div>
            )
        if (!_events.length)
            return (
                <div className={classes.body}>
                    <Icons.EmptySimple className={classes.emptyIcon} />
                    <Typography className={classes.emptyText}>{t('plugin_collectible_nft_activity_empty')}</Typography>
                </div>
            )
        return (
            <CollectibleTab>
                <div className={classes.body} style={{ justifyContent: 'unset' }}>
                    {_events.map((x, idx) => (
                        <NFTActivityCard type={resolveActivityType(x.type)} key={idx} activity={x} />
                    ))}
                </div>
            </CollectibleTab>
        )
    }, [events, classes])
}
