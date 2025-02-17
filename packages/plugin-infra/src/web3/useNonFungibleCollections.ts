import { useAsyncRetry } from 'react-use'
import { asyncIteratorToArray } from '@masknet/shared-base'
import { HubIndicator, NetworkPluginID, NonFungibleCollection, pageableToIterator } from '@masknet/web3-shared-base'
import type { Web3Helper } from '../web3-helpers'
import { useAccount } from './useAccount'
import { useWeb3Hub } from './useWeb3Hub'

export function useNonFungibleCollections<S extends 'all' | void = void, T extends NetworkPluginID = NetworkPluginID>(
    pluginID?: T,
    options?: Web3Helper.Web3HubOptionsScope<S, T>,
) {
    const account = useAccount(pluginID, options?.account)
    const hub = useWeb3Hub(pluginID, options)

    return useAsyncRetry<
        Array<NonFungibleCollection<Web3Helper.ChainIdScope<S, T>, Web3Helper.SchemaTypeScope<S, T>>>
    >(async () => {
        if (!account || !hub) return []

        const iterator = pageableToIterator(async (indicator?: HubIndicator) => {
            if (!hub.getNonFungibleCollectionsByOwner) return
            return hub.getNonFungibleCollectionsByOwner(account, {
                indicator,
                size: 50,
                ...options,
            })
        })
        return asyncIteratorToArray(iterator)
    }, [account, hub, JSON.stringify(options)])
}
