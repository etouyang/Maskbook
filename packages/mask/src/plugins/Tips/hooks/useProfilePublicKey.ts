import type { ProfileIdentifier } from '@masknet/shared-base'
import { useAsync } from 'react-use'
import Services from '../../../extension/service'

export function useProfilePublicKey(receiver: ProfileIdentifier | null | undefined) {
    return useAsync(async () => {
        if (!receiver) return
        const persona = await Services.Identity.queryPersonaByProfile(receiver)
        return persona?.identifier
    }, [receiver])
}
