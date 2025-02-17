import { CurrentSNSNetwork, Plugin } from '@masknet/plugin-infra'
import { PLUGIN_ID, PLUGIN_NAME } from './constants'
import { NetworkPluginID } from '@masknet/web3-shared-base'
import { ChainId } from '@masknet/web3-shared-evm'

export const base: Plugin.Shared.Definition = {
    ID: PLUGIN_ID,
    name: { fallback: PLUGIN_NAME },
    publisher: { name: { fallback: 'Mask Network' }, link: 'https://mask.io/' },
    enableRequirement: {
        architecture: { app: false, web: true },
        networks: {
            type: 'opt-in',
            networks: {
                [CurrentSNSNetwork.Twitter]: true,
            },
        },
        web3: {
            [NetworkPluginID.PLUGIN_EVM]: {
                supportedChainIds: [
                    ChainId.Mainnet,
                    ChainId.BSC,
                    ChainId.Matic,
                    ChainId.Arbitrum,
                    ChainId.xDai,
                    ChainId.Aurora,
                    ChainId.Avalanche,
                    ChainId.Fantom,
                    ChainId.Astar,
                    ChainId.Harmony,
                    ChainId.Optimism,
                ],
            },
        },
        target: 'stable',
    },
    experimentalMark: true,
}
