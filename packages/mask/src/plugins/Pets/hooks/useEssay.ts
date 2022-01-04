import { ImageType, ShowMeta } from './../types'
import { useEffect, useState } from 'react'
import { useAsync } from 'react-use'
import { PluginPetRPC } from '../messages'
import type { User } from '../types'
import { DEFAULT_SET_WORD, MASK_TWITTER, DEFAULT_PUNK_MASK_WORD } from '../constants'
import { getAssetAsBlobURL } from '../../../utils'

export function useEssay(user: User, refresh?: boolean) {
    return useAsync(async () => {
        if (user.address) {
            const metaData = await PluginPetRPC.getEssay(user.address)
            return metaData?.userId === user.userId ? metaData : null
        }
        return null
    }, [user, refresh]).value
}

export function useDefaultEssay(user: User) {
    const [essayMeta, setEssayMeta] = useState<ShowMeta | undefined>(undefined)
    const PunkIcon = getAssetAsBlobURL(new URL('../assets/punk2d.png', import.meta.url))
    useEffect(() => {
        if (user?.userId || user?.userId !== '$unknown') {
            setEssayMeta({
                image: PunkIcon,
                word: user.userId === MASK_TWITTER ? DEFAULT_PUNK_MASK_WORD : DEFAULT_SET_WORD,
                type: user.userId === MASK_TWITTER ? ImageType.GLB : ImageType.NORMAL,
            })
        } else {
            setEssayMeta(undefined)
        }
    }, [user])
    return essayMeta
}
