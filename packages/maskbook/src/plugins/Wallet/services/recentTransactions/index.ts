import type { TransactionReceipt } from 'web3-core'
import type { JsonRpcPayload } from 'web3-core-helpers'
import type { TransactionStatusType } from '@masknet/web3-shared-evm'
import { getSendTransactionComputedPayload } from '../../../../extension/background-script/EthereumService'
import * as database from './database'
import * as watcher from './watcher'
import * as helpers from './helpers'

export * from './progress'

export interface RecentTransaction {
    at: Date
    hash: string
    status: TransactionStatusType
    receipt?: TransactionReceipt | null
    payload?: JsonRpcPayload
    payloadReplacement?: JsonRpcPayload
    computedPayload?: UnboxPromise<ReturnType<typeof getSendTransactionComputedPayload>>
}

export async function addRecentTransaction(address: string, hash: string, payload: JsonRpcPayload) {
    watcher.watchTransaction(hash, payload)
    await database.addRecentTransaction(address, hash, payload)
}

export async function removeRecentTransaction(address: string, hash: string) {
    watcher.unwatchTransaction(hash)
    await database.removeRecentTransaction(address, hash)
}

export async function replaceRecentTransaction(
    address: string,
    hash: string,
    newHash: string,
    payload: JsonRpcPayload,
) {
    watcher.watchTransaction(hash, payload)
    watcher.watchTransaction(hash, payload)
    await database.replaceRecentTransaction(address, hash, newHash, payload)
}

export async function clearRecentTransactions(address: string) {
    const transactions = await database.getRecentTransactions(address)
    transactions.forEach((x) => watcher.unwatchTransaction(x.hash))
    await database.clearRecentTransactions(address)
}

export async function getRecentTransaction(address: string, hash: string) {
    const list = await getRecentTransactionList(address)
    return list.find((x) => x.hash === hash)
}

export async function getRecentTransactionList(address: string): Promise<RecentTransaction[]> {
    const transactions = await database.getRecentTransactions(address)
    const allSettled = await Promise.allSettled(
        transactions.map<Promise<RecentTransaction>>(
            async ({ at, hash, hashReplacement, payload, payloadReplacement }) => {
                watcher.watchTransaction(hash, payload)
                if (hashReplacement) watcher.watchTransaction(hash, payload)

                // read receipt in race
                const receipt =
                    (await watcher.getReceipt(hash)) ||
                    (await (hashReplacement ? watcher.getReceipt(hashReplacement) : null))

                return {
                    at,
                    hash: receipt?.transactionHash ?? hash,
                    status: helpers.getReceiptStatus(receipt),
                    receipt,
                    payload,
                    payloadReplacement,
                    computedPayload: await getSendTransactionComputedPayload(payloadReplacement ?? payload),
                }
            },
        ),
    )

    // compose result
    const transaction_: RecentTransaction[] = []
    allSettled.forEach((x) => (x.status === 'fulfilled' ? transaction_.push(x.value) : undefined))
    return transaction_
}
