import { describe, test, expect } from 'vitest'
import { resolveCORSLink, resolveIPFSLink } from '../src/utils/resolver'

const MASK_URL = 'https://mask.io'
const HASH = 'QmYE5ZAofUqGV7ph3owYBDTmGkZU44teCVAzLrKWwHCURM'
const IMAGE_DATA_PARTIAL = 'data:image/png;base64,iVB'

describe('resolveCORSLink', () => {
    test.each([
        { give: '', expected: '' },
        { give: MASK_URL, expected: `https://cors.r2d2.to?${encodeURIComponent(MASK_URL)}` },
    ])('.resolveCORSLink', ({ give, expected }) => {
        expect(resolveCORSLink(give)).toBe(expected)
    })
})

describe('resolveIPFSLink', () => {
    test.each(
        [
            { give: '', expected: '' },
            { give: HASH, expected: `https://ipfs.io/ipfs/${HASH}` },
            { give: `ipfs://${HASH}`, expected: `https://ipfs.io/ipfs/${HASH}` },
            { give: `ipfs://ipfs/${HASH}`, expected: `https://ipfs.io/ipfs/${HASH}` },
            { give: `https://ipfs.io/ipfs/${IMAGE_DATA_PARTIAL}`, expected: IMAGE_DATA_PARTIAL },
            { give: `https://ipfs.io/ipfs/${HASH}`, expected: `https://ipfs.io/ipfs/${HASH}` },
            { give: MASK_URL, expected: MASK_URL },
        ].flatMap(({ give, expected }) => [
            { give, expected },
            { give: `https://cors.r2d2.to?${encodeURIComponent(give)}`, expected },
        ]),
    )('.resolveIPFSLink($give)', ({ give, expected }) => {
        expect(resolveIPFSLink(give)).toBe(expected)
    })
})
