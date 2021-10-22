import { useCallback, useEffect, useRef } from 'react'
import { WalletMessages } from '@masknet/plugin-wallet'
import { TransactionStateType } from '../../../web3-shared/evm'
import type { ShowSnackbarOptions, SnackbarKey, SnackbarMessage } from '@masknet/theme'
import { useCustomSnackbar } from '@masknet/theme'

// todo: should merge in plugin infra package when plugin infra ready
export function TransactionSnackbar() {
    const { showSnackbar, closeSnackbar } = useCustomSnackbar()
    const snackbarKeyRef = useRef<SnackbarKey>()

    const showSingletonSnackbar = useCallback(
        (title: SnackbarMessage, options: ShowSnackbarOptions) => {
            if (snackbarKeyRef.current !== undefined) closeSnackbar(snackbarKeyRef.current)
            snackbarKeyRef.current = showSnackbar(title, options)
            return () => {
                closeSnackbar(snackbarKeyRef.current)
            }
        },
        [showSnackbar, closeSnackbar],
    )

    useEffect(() => {
        return WalletMessages.events.transactionProgressUpdated.on((progress) => {
            console.log('DEBUG: progress updated')
            console.log(progress)
            showSingletonSnackbar(TransactionStateType[progress.state.type], {
                variant: 'success',
            })
        })
    }, [])

    return null
}
