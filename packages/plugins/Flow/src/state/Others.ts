import type { Plugin } from '@masknet/plugin-infra'
import { OthersState } from '@masknet/plugin-infra/web3'
import { createExplorerResolver, isSameAddress } from '@masknet/web3-shared-base'
import {
    isValidDomain,
    isValidAddress,
    isZeroAddress,
    isNativeTokenAddress,
    ChainId,
    formatAddress,
    formatDomainName,
    ProviderType,
    NetworkType,
    Transaction,
    SchemaType,
    CHAIN_DESCRIPTORS,
    NETWORK_DESCRIPTORS,
    PROVIDER_DESCRIPTORS,
    getDefaultChainId,
    getDefaultNetworkType,
    getDefaultProviderType,
    getZeroAddress,
    getMaskTokenAddress,
    getNativeTokenAddress,
} from '@masknet/web3-shared-flow'

export class Others extends OthersState<ChainId, SchemaType, ProviderType, NetworkType, Transaction> {
    constructor(context: Plugin.Shared.SharedContext) {
        super(context, {
            chainDescriptors: CHAIN_DESCRIPTORS,
            networkDescriptors: NETWORK_DESCRIPTORS,
            providerDescriptors: PROVIDER_DESCRIPTORS,
        })
    }

    override explorerResolver = createExplorerResolver(this.options.chainDescriptors, {
        addressPathname: '/account/:address',
        transactionPathname: '/transaction/:id',
        fungibleTokenPathname: '/contract/:address',
        nonFungibleTokenPathname: '/contract/:address',
    })

    resolveFungibleTokenLink(chainId: ChainId, address: string): string {
        throw new Error('Method not implemented.')
    }

    override isValidDomain = isValidDomain
    override isValidAddress = isValidAddress
    override isSameAddress = isSameAddress
    override isZeroAddress = isZeroAddress
    override isNativeTokenAddress = isNativeTokenAddress

    override getDefaultChainId = getDefaultChainId
    override getDefaultNetworkType = getDefaultNetworkType
    override getDefaultProviderType = getDefaultProviderType
    override getZeroAddress = getZeroAddress
    override getNativeTokenAddress = getNativeTokenAddress
    override getMaskTokenAddress = getMaskTokenAddress

    override formatAddress = formatAddress
    override formatDomainName = formatDomainName
    override formatTokenId = () => ''
}
