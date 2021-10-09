import type { JsonRpcPayload } from 'web3-core-helpers'
import { unreachable } from '@dimensiondev/kit'
import { WalletMessages } from '@masknet/plugin-wallet'
import { TransactionState, TransactionStateType, EthereumMethodType } from '@masknet/web3-shared-evm'
import * as helpers from './helpers'

export interface TransactionProgress {
    state: TransactionState
    payload: JsonRpcPayload
}

const watched: Map<string, TransactionProgress> = new Map()

export function watchProgress(payload: JsonRpcPayload, state: TransactionState) {
    const payloadId = payload.id as string
    if (!payloadId) return
    if (payload.method !== EthereumMethodType.ETH_SEND_TRANSACTION) return

    if (watched.has(payloadId)) return
    watched.set(payloadId, {
        payload,
        state,
    })
    updateProgress(payloadId, state)
}

export function unwatchProgress(payloadId: string) {
    watched.delete(payloadId)
}

export function unwatchAllProgresses() {
    watched.clear()
}

function updateProgress(payloadId: string, state: TransactionState) {
    const progress = watched.get(payloadId)
    if (!progress) return

    progress.state = state
    WalletMessages.events.transactionProgressUpdated.sendToAll(progress)

    // stop watch progress
    if (isFinalProgress(payloadId, state)) unwatchProgress(payloadId)
}

function isFinalProgress(payloadId: string, state: TransactionState) {
    const progress = watched.get(payloadId)
    if (!progress) return false

    return [TransactionStateType.CONFIRMED, TransactionStateType.FAILED].includes(progress.state.type)
}

function isNextProgressAvailable(payloadId: string, state: TransactionState) {
    const progress = watched.get(payloadId)
    if (!progress) return false

    const type = state.type
    switch (type) {
        case TransactionStateType.UNKNOWN:
            return false
        case TransactionStateType.WAIT_FOR_CONFIRMING:
            return [TransactionStateType.UNKNOWN].includes(progress.state.type)
        case TransactionStateType.HASH:
            return [TransactionStateType.UNKNOWN, TransactionStateType.WAIT_FOR_CONFIRMING].includes(
                progress.state.type,
            )
        case TransactionStateType.RECEIPT:
            return [
                TransactionStateType.UNKNOWN,
                TransactionStateType.WAIT_FOR_CONFIRMING,
                TransactionStateType.HASH,
            ].includes(progress.state.type)
        case TransactionStateType.CONFIRMED:
            return [
                TransactionStateType.UNKNOWN,
                TransactionStateType.WAIT_FOR_CONFIRMING,
                TransactionStateType.HASH,
                TransactionStateType.RECEIPT,
            ].includes(progress.state.type)
        case TransactionStateType.FAILED:
            return [
                TransactionStateType.UNKNOWN,
                TransactionStateType.WAIT_FOR_CONFIRMING,
                TransactionStateType.HASH,
                TransactionStateType.RECEIPT,
            ].includes(progress.state.type)
        default:
            unreachable(type)
    }
}

export function notifyProgress({ state, payload }: PartialRequired<TransactionProgress, 'state'>) {
    const payloadId = payload?.id as string
    const hash = helpers.getTransactionHashFromState(state)
    if (!payloadId && !hash) return

    const progress =
        watched.get(payloadId) ??
        [...watched.values()].find((x) => {
            const otherHash = helpers.getTransactionHashFromState(x.state)
            return otherHash ? otherHash === hash : false
        })
    if (!progress) return

    const payloadId_ = progress.payload.id as string
    if (isNextProgressAvailable(payloadId_, state)) updateProgress(payloadId_, state)
}
