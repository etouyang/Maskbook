import { NextIDPlatform, ProfileIdentifier } from '../index.js'
import { EnhanceableSite } from '../Site/type.js'

export function nextIDPlatformToNetwork(platform: NextIDPlatform) {
    // inline the pairs for testing, if out the pairs will not work
    const pairs = [[NextIDPlatform.Twitter, EnhanceableSite.Twitter]]
    const pair = pairs.find((x) => x[0] === platform)
    return pair?.[1]
}

export function networkToNextIDPlatform(site: EnhanceableSite) {
    const pairs = [[NextIDPlatform.Twitter, EnhanceableSite.Twitter]]
    const pair = pairs.find((x) => x[1] === site)
    return pair?.[0]
}

export function nextIDIdentityToProfile(nextIDIdentity: string, platform: NextIDPlatform) {
    const network = nextIDPlatformToNetwork(platform)
    if (!network) return

    return ProfileIdentifier.of(network, nextIDIdentity).unwrap()
}
