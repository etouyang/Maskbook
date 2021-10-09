import type { RequestArguments, TransactionConfig } from 'web3-core'
import type { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers'
import { INTERNAL_nativeSend, INTERNAL_send, SendOverrides } from './send'
import { hasNativeAPI, nativeAPI } from '../../../utils/native-rpc'
import { EthereumMethodType, ProviderType, TransactionStateType } from '@masknet/web3-shared-evm'
import {
    currentMaskWalletAccountWalletSettings,
    currentMaskWalletChainIdSettings,
    currentProviderSettings,
} from '../../../plugins/Wallet/settings'
import { defer, Flags } from '../../../utils'
import { WalletRPC } from '../../../plugins/Wallet/messages'
import { openPopupWindow } from '../HelperService'
import Services from '../../service'

let id = 0

const UNCONFIRMED_CALLBACK_MAP = new Map<number, (error: Error | null, response?: JsonRpcResponse) => void>()
const RISK_METHOD_LIST = [
    EthereumMethodType.ETH_SIGN,
    EthereumMethodType.PERSONAL_SIGN,
    EthereumMethodType.ETH_SIGN_TYPED_DATA,
    EthereumMethodType.ETH_DECRYPT,
    EthereumMethodType.ETH_GET_ENCRYPTION_PUBLIC_KEY,
    EthereumMethodType.ETH_SEND_TRANSACTION,
]

export interface RequestOptions {
    popupsWindow?: boolean
}

function getSendMethod() {
    if (hasNativeAPI && nativeAPI) return INTERNAL_nativeSend
    return INTERNAL_send
}

function getPayloadId(payload: JsonRpcPayload) {
    return typeof payload.id === 'string' ? Number.parseInt(payload.id, 10) : payload.id
}

function isRiskMethod(method: EthereumMethodType) {
    return RISK_METHOD_LIST.includes(method)
}

export async function request<T extends unknown>(
    requestArguments: RequestArguments,
    overrides?: SendOverrides,
    options?: RequestOptions,
) {
    return new Promise<T>(async (resolve, reject) => {
        requestSend(
            {
                jsonrpc: '2.0',
                id,
                params: [],
                ...requestArguments,
            },
            (error, response) => {
                if (error || response?.error) reject(error ?? response?.error)
                else resolve(response?.result)
            },
            overrides,
            options,
        )
    })
}

export async function requestSend(
    payload: JsonRpcPayload,
    callback: (error: Error | null, response?: JsonRpcResponse) => void,
    overrides?: SendOverrides,
    options?: RequestOptions,
) {
    id += 1
    const { providerType = currentProviderSettings.value } = overrides ?? {}
    const { popupsWindow = true } = options ?? {}
    const payload_ = {
        ...payload,
        id,
    }
    const hijackedCallback = (error: Error | null, response?: JsonRpcResponse) => {
        if (error)
            WalletRPC.notifyProgress({
                payload: payload_,
                state: {
                    type: TransactionStateType.FAILED,
                    error,
                },
            })
        callback(error, response)
    }
    if (
        Flags.v2_enabled &&
        isRiskMethod(payload_.method as EthereumMethodType) &&
        providerType === ProviderType.MaskWallet
    ) {
        try {
            WalletRPC.watchProgress(payload_, {
                type: TransactionStateType.WAIT_FOR_CONFIRMING,
            })
            await WalletRPC.pushUnconfirmedRequest(payload_)
        } catch (error) {
            if (error instanceof Error) hijackedCallback(error)
            return
        }
        UNCONFIRMED_CALLBACK_MAP.set(payload_.id, hijackedCallback)
        if (popupsWindow) openPopupWindow()
        return
    }
    WalletRPC.watchProgress(payload, {
        type:
            providerType === ProviderType.MaskWallet
                ? TransactionStateType.UNKNOWN
                : TransactionStateType.WAIT_FOR_CONFIRMING,
    })
    getSendMethod()(payload_, hijackedCallback, overrides)
}

export async function confirmRequest(payload: JsonRpcPayload) {
    const pid = getPayloadId(payload)
    if (!pid) return
    const [deferred, resolve, reject] = defer<JsonRpcResponse | undefined, Error>()
    getSendMethod()(
        payload,
        (error, response) => {
            UNCONFIRMED_CALLBACK_MAP.get(pid)?.(error, response)

            if (error) reject(error)
            else if (response?.error) reject(new Error(`Failed to send transaction: ${response.error}`))
            else {
                WalletRPC.deleteUnconfirmedRequest(payload)
                    // Close pop-up window when request is confirmed
                    .then(Services.Helper.removePopupWindow)
                    .then(() => {
                        UNCONFIRMED_CALLBACK_MAP.delete(pid)
                    })
                resolve(response)
            }
        },
        {
            account: currentMaskWalletAccountWalletSettings.value,
            chainId: currentMaskWalletChainIdSettings.value,
            providerType: ProviderType.MaskWallet,
        },
    )
    return deferred
}

export async function rejectRequest(payload: JsonRpcPayload) {
    const pid = getPayloadId(payload)
    if (!pid) return
    UNCONFIRMED_CALLBACK_MAP.get(pid)?.(new Error('User rejected!'))
    await WalletRPC.deleteUnconfirmedRequest(payload)
    // Close pop-up window when request is rejected
    await Services.Helper.removePopupWindow()
    UNCONFIRMED_CALLBACK_MAP.delete(pid)
}

export async function replaceRequest(payload: JsonRpcPayload, overrides?: TransactionConfig) {
    const pid = getPayloadId(payload)
    if (!pid || payload.method !== EthereumMethodType.ETH_SEND_TRANSACTION) return

    const [config] = payload.params as [TransactionConfig]
    return request<string>({
        method: payload.method,
        params: [
            {
                ...config,
                ...overrides,
            },
        ],
    })
}

export async function cancelRequest(payload: JsonRpcPayload, overrides?: TransactionConfig) {
    const pid = getPayloadId(payload)
    if (!pid || payload.method !== EthereumMethodType.ETH_SEND_TRANSACTION) return

    const [config] = payload.params as [TransactionConfig]
    return request<string>({
        method: payload.method,
        params: [
            {
                ...config,
                ...overrides,
                to: config.from,
                data: '0x',
                value: '0x0',
            },
        ],
    })
}
