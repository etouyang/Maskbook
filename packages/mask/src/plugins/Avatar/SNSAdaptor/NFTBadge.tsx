import { openWindow } from '@masknet/shared-base-ui'
import { makeStyles, useStylesExtends } from '@masknet/theme'
import Link from '@mui/material/Link'
import { useI18N } from '../../../utils'
import type { AvatarMetaDB, NFTInfo } from '../types'
import { formatPrice, formatText } from '../utils'
import { NFTAvatarRing } from './NFTAvatarRing'

const useStyles = makeStyles()((theme) => ({
    root: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        position: 'absolute',
        bottom: 0,
    },
}))

interface NFTBadgeProps extends withClasses<'root' | 'text' | 'icon'> {
    avatar: AvatarMetaDB
    nftInfo?: NFTInfo
    size?: number
    width?: number
    hasRainbow?: boolean
    borderSize?: number
}

export function NFTBadge(props: NFTBadgeProps) {
    const { avatar, nftInfo, size = 140, hasRainbow, borderSize } = props
    const classes = useStylesExtends(useStyles(), props)
    const { t } = useI18N()

    if (!nftInfo)
        return (
            <div className={classes.root}>
                <NFTAvatarRing
                    id="NFTAvatarRing"
                    width={size}
                    strokeWidth={14}
                    stroke="black"
                    hasRainbow={hasRainbow}
                    borderSize={borderSize}
                    fontSize={9}
                    text={t('loading')}
                    price=""
                />
            </div>
        )
    return (
        <div
            className={classes.root}
            onClick={(e) => {
                e.preventDefault()
                if (!nftInfo.permalink) return
                openWindow(nftInfo.permalink)
            }}>
            <Link href={nftInfo?.permalink ?? ''} target="_blank" rel="noopener noreferrer">
                <NFTAvatarRing
                    id="NFTAvatarRing"
                    width={size}
                    strokeWidth={14}
                    stroke="black"
                    hasRainbow={hasRainbow}
                    borderSize={borderSize}
                    fontSize={9}
                    text={`${formatText(nftInfo.name ?? '', avatar.tokenId)} ${
                        nftInfo.slug?.toLowerCase() === 'ens' ? 'ENS' : ''
                    }`}
                    price={formatPrice(nftInfo.amount ?? '0', nftInfo.symbol ?? 'ETH')}
                />
            </Link>
        </div>
    )
}
