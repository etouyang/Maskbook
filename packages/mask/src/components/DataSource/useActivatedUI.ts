import { useAsync, useAsyncRetry } from 'react-use'
import { Subscription, useSubscription } from 'use-subscription'
import { first, isEqual } from 'lodash-unified'
import { ValueRef } from '@dimensiondev/holoflows-kit'
import { useValueRef } from '@masknet/shared-base-ui'
import type { IdentityResolved } from '@masknet/plugin-infra'
import { NextIDProof } from '@masknet/web3-providers'
import { EMPTY_LIST, ProfileInformation } from '@masknet/shared-base'
import type { SocialIdentity } from '@masknet/web3-shared-base'
import { activatedSocialNetworkUI, globalUIState } from '../../social-network'
import Services from '../../extension/service'
import { MaskMessages, sortPersonaBindings } from '../../utils'
import { useEffect } from 'react'

async function queryPersonaFromDB(identityResolved: IdentityResolved) {
    if (!identityResolved.identifier) return
    return Services.Identity.queryPersonaByProfile(identityResolved.identifier)
}

async function queryPersonasFromNextID(identityResolved: IdentityResolved) {
    if (!identityResolved.identifier) return
    if (!activatedSocialNetworkUI.configuration.nextIDConfig?.platform) return
    return NextIDProof.queryAllExistedBindingsByPlatform(
        activatedSocialNetworkUI.configuration.nextIDConfig?.platform,
        identityResolved.identifier.userId.toLowerCase(),
    )
}

const defaults = new ValueRef<IdentityResolved>({}, isEqual)

const CurrentIdentitySubscription: Subscription<ProfileInformation | undefined> = {
    getCurrentValue() {
        const all = globalUIState.profiles.value
        const current = (activatedSocialNetworkUI.collecting.identityProvider?.recognized || defaults).value.identifier
        return all.find((i) => i.identifier === current) || first(all)
    },
    subscribe(sub) {
        const a = globalUIState.profiles.addListener(sub)
        const b = activatedSocialNetworkUI.collecting.identityProvider?.recognized.addListener(sub)
        return () => [a(), b?.()]
    },
}

export function useCurrentIdentity() {
    return useSubscription(CurrentIdentitySubscription)
}

export function useLastRecognizedIdentity() {
    return useValueRef(activatedSocialNetworkUI.collecting.identityProvider?.recognized || defaults)
}

export function useCurrentVisitingIdentity() {
    return useValueRef(activatedSocialNetworkUI.collecting.currentVisitingIdentityProvider?.recognized || defaults)
}

export function useIsOwnerIdentity(identity: IdentityResolved) {
    const lastRecognizedIdentity = useLastRecognizedIdentity()
    const lastRecognizedUserId = lastRecognizedIdentity.identifier?.userId
    const currentVisitingUserId = identity.identifier?.userId
    return !!(
        lastRecognizedUserId &&
        currentVisitingUserId &&
        lastRecognizedUserId.toLowerCase() === currentVisitingUserId.toLowerCase()
    )
}

export function useCurrentLinkedPersona() {
    const currentIdentity = useSubscription(CurrentIdentitySubscription)
    return useAsync(async () => {
        if (!currentIdentity?.linkedPersona) return
        return Services.Identity.queryPersona(currentIdentity.linkedPersona)
    }, [currentIdentity?.linkedPersona])
}

/**
 * Get a persona bound with the last recognized identity from DB
 */
export function useLastRecognizedPersona() {
    const identity = useLastRecognizedIdentity()
    return useAsyncRetry(async () => queryPersonaFromDB(identity), [identity.identifier?.toText()])
}

/**
 * Get a persona bound with the currently visiting identity from DB
 */
export function useCurrentVisitingPersona() {
    const identity = useCurrentVisitingIdentity()
    return useAsyncRetry(async () => queryPersonaFromDB(identity), [identity.identifier?.toText()])
}

/**
 * Get all personas bound with the last recognized identity from NextID service
 */
export function useLastRecognizedPersonas() {
    const identity = useLastRecognizedIdentity()
    return useAsyncRetry(async () => {
        const bindings = await queryPersonasFromNextID(identity)
        return bindings?.sort((a, b) => sortPersonaBindings(a, b, identity.identifier?.userId.toLowerCase()))
    }, [identity.identifier?.userId])
}

/**
 * Get all personas bound with the currently visiting identity from NextID service
 */
export function useCurrentVisitingPersonas() {
    const identity = useCurrentVisitingIdentity()
    return useAsyncRetry(async () => {
        const bindings = await queryPersonasFromNextID(identity)
        return bindings?.sort((a, b) => sortPersonaBindings(a, b, identity.identifier?.userId.toLowerCase()))
    }, [identity.identifier?.userId])
}

/**
 * Get the social identity of the given identity
 */
export function useSocialIdentity(identity: IdentityResolved) {
    const isOwner = useIsOwnerIdentity(identity)

    const result = useAsyncRetry<SocialIdentity>(async () => {
        const bindings = await queryPersonasFromNextID(identity)
        const persona = await queryPersonaFromDB(identity)
        const personaBindings =
            bindings?.filter((x) => x.persona === persona?.identifier.publicKeyAsHex.toLowerCase()) ?? EMPTY_LIST
        return {
            ...identity,
            isOwner,
            publicKey: persona?.identifier.publicKeyAsHex,
            hasBinding: personaBindings.length > 0,
            binding: first(personaBindings),
        }
    }, [isOwner, identity.identifier?.toText()])

    useEffect(() => MaskMessages.events.ownProofChanged.on(result.retry), [result.retry])

    return result
}

/**
 * Get the social identity of the last recognized identity
 */
export function useLastRecognizedSocialIdentity() {
    const identity = useLastRecognizedIdentity()
    return useSocialIdentity(identity)
}

/**
 * Get the social identity of the current visiting identity
 */
export function useCurrentVisitingSocialIdentity() {
    const identity = useCurrentVisitingIdentity()
    return useSocialIdentity(identity)
}
