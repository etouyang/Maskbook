import type { Plugin } from '@masknet/plugin-infra'
import type {
    Block,
    ChainId,
    GasOption,
    NetworkType,
    ProviderType,
    SchemaType,
    Signature,
    Operation,
    Transaction,
    TransactionSignature,
    TransactionDetailed,
    TransactionParameter,
    TransactionReceipt,
    Web3,
} from '@masknet/web3-shared-evm'
import { base } from '../../base'
import { createWeb3State } from '../../state'
import { SharedContextSettings, Web3StateSettings } from '../../settings'

const dashboard: Plugin.Dashboard.Definition<
    ChainId,
    SchemaType,
    ProviderType,
    NetworkType,
    Signature,
    GasOption,
    Block,
    Operation,
    Transaction,
    TransactionReceipt,
    TransactionDetailed,
    TransactionSignature,
    TransactionParameter,
    Web3
> = {
    ...base,
    async init(signal, context) {
        const Web3State = createWeb3State(context)

        dashboard.Web3State = Web3State
        Web3StateSettings.value = Web3State
        SharedContextSettings.value = context
    },
}

export default dashboard
