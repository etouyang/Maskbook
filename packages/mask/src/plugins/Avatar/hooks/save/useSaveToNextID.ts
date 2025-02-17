import type { BindingProof, ECKeyIdentifier, EnhanceableSite } from '@masknet/shared-base'
import { useWeb3State } from '@masknet/plugin-infra/web3'
import { NetworkPluginID } from '@masknet/web3-shared-base'
import { useCallback } from 'react'
import { activatedSocialNetworkUI } from '../../../../social-network'
import { useSaveAddress } from './useSaveAddress'
import type { NextIDAvatarMeta } from '../../types'
import { PLUGIN_ID } from '../../constants'

export function useSaveToNextID() {
    const { Storage } = useWeb3State()
    const saveAddress = useSaveAddress()
    return useCallback(
        async (info: NextIDAvatarMeta, account: string, persona?: ECKeyIdentifier, proof?: BindingProof) => {
            if (!proof?.identity || !persona || !Storage) return
            const storage = Storage.createNextIDStorage(proof.identity, proof.platform, persona)

            await storage.set(PLUGIN_ID, info)

            saveAddress(
                info.userId,
                info.pluginId ?? NetworkPluginID.PLUGIN_EVM,
                account,
                activatedSocialNetworkUI.networkIdentifier as EnhanceableSite,
            )

            return info
        },
        [saveAddress, Storage],
    )
}
