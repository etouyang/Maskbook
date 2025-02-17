import type { EnhanceableSite } from '@masknet/shared-base'
import { NetworkPluginID } from '@masknet/web3-shared-base'
import { useAsyncRetry } from 'react-use'
import { activatedSocialNetworkUI } from '../../../social-network'
import type { RSS3_KEY_SNS } from '../constants'
import type { AvatarMetaDB, NextIDAvatarMeta } from '../types'
import { getNFTAvatarByUserId } from '../utils'
import { useGetNFTAvatar } from './useGetNFTAvatar'
import LRU from 'lru-cache'

const cache = new LRU<string, Promise<NextIDAvatarMeta | undefined>>({
    max: 500,
    ttl: 60 * 1000,
})

type GetNFTAvatar = (
    userId?: string,
    network?: EnhanceableSite,
    snsKey?: RSS3_KEY_SNS,
) => Promise<AvatarMetaDB | undefined>

export function usePersonaNFTAvatar(userId: string, avatarId: string, persona: string, snsKey: RSS3_KEY_SNS) {
    const getNFTAvatar = useGetNFTAvatar()

    return useAsyncRetry(async () => {
        if (!userId) return
        const key = `${userId}-${activatedSocialNetworkUI.networkIdentifier}`
        if (!cache.has(key)) cache.set(key, getNFTAvatarForCache(userId, snsKey, avatarId, persona, getNFTAvatar))
        const v = cache.get(key)
        return v
    }, [userId, getNFTAvatar, avatarId, activatedSocialNetworkUI.networkIdentifier])
}

async function getNFTAvatarForCache(
    userId: string,
    snsKey: RSS3_KEY_SNS,
    avatarId: string,
    persona: string,
    fn: GetNFTAvatar,
) {
    const avatarMetaFromPersona = await getNFTAvatarByUserId(userId, avatarId, persona)
    if (avatarMetaFromPersona) return avatarMetaFromPersona
    const avatarMeta = await fn(userId, activatedSocialNetworkUI.networkIdentifier as EnhanceableSite, snsKey)
    if (!avatarMeta) return
    if (avatarMeta.pluginId === NetworkPluginID.PLUGIN_SOLANA) {
        return { imageUrl: '', nickname: '', ...avatarMeta, address: avatarMeta.tokenId }
    }
    return { imageUrl: '', nickname: '', ...avatarMeta }
}
