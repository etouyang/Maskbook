import type { Plugin } from '@masknet/plugin-infra'
import { AddressBook } from './AddressBook'
import { Hub } from './Hub'
import { Provider } from './Provider'
import { Connection } from './Connection'
import { Settings } from './Settings'
import { Transaction } from './Transaction'
import { Wallet } from './Wallet'
import { Others } from './Others'
import type { FlowWeb3State } from './Connection/types'
import { IdentityService } from './IdentityService'
import { Storage } from './Storage'

export function createWeb3State(context: Plugin.Shared.SharedUIContext): FlowWeb3State {
    const Provider_ = new Provider(context)
    return {
        AddressBook: new AddressBook(context, {
            chainId: Provider_.chainId,
        }),
        Hub: new Hub(context, {
            chainId: Provider_.chainId,
            account: Provider_.account,
        }),
        IdentityService: new IdentityService(context),
        Settings: new Settings(context),
        Transaction: new Transaction(context, {
            chainId: Provider_.chainId,
            account: Provider_.account,
        }),
        Provider: Provider_,
        Connection: new Connection(context, {
            chainId: Provider_.chainId,
            account: Provider_.account,
            providerType: Provider_.providerType,
        }),
        Wallet: new Wallet(context),
        Others: new Others(context),
        Storage: new Storage(),
    }
}
