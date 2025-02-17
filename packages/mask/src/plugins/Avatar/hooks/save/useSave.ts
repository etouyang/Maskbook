import type { BindingProof, ECKeyIdentifier } from '@masknet/shared-base'
import type { TwitterBaseAPI } from '@masknet/web3-providers'
import { NetworkPluginID } from '@masknet/web3-shared-base'
import { ChainId, SchemaType } from '@masknet/web3-shared-evm'
import { useAsyncFn } from 'react-use'
import type { AllChainsNonFungibleToken, NextIDAvatarMeta } from '../../types'
import { useSaveKV } from './useSaveKV'
import { useSaveToNextID } from './useSaveToNextID'
import { useSaveToRSS3 } from './useSaveToRSS3'

export type AvatarInfo = TwitterBaseAPI.AvatarInfo & { avatarId: string }

export function useSave(pluginId: NetworkPluginID, chainId: ChainId) {
    const saveToNextID = useSaveToNextID()
    const saveToRSS3 = useSaveToRSS3()
    const saveToKV = useSaveKV(pluginId)

    return useAsyncFn(
        async (
            account: string,
            isBindAccount: boolean,
            token: AllChainsNonFungibleToken,
            data: AvatarInfo,
            persona: ECKeyIdentifier,
            proof: BindingProof,
        ) => {
            if (!token.contract?.address || !token.tokenId) return
            const info: NextIDAvatarMeta = {
                pluginId,
                nickname: data.nickname,
                userId: data.userId,
                imageUrl: data.imageUrl,
                avatarId: data.avatarId,
                address: token.contract?.address ?? '',
                tokenId: token.tokenId,
                chainId: (token.contract?.chainId ?? ChainId.Mainnet) as ChainId,
                schema: (token.contract?.schema ?? SchemaType.ERC721) as SchemaType,
            }

            try {
                switch (pluginId) {
                    case NetworkPluginID.PLUGIN_EVM: {
                        if (isBindAccount) {
                            return saveToNextID(info, account, persona, proof)
                        }
                        return saveToRSS3(info, account)
                    }
                    default:
                        return saveToKV(info, account, persona, proof)
                }
            } catch {
                return
            }
        },
        [saveToNextID, saveToRSS3, pluginId],
    )
}
