// Regexes for wallet Descriptors and Extended Keys (XKeys)

// Descriptors
// For now, we only support single key descriptors
// with three specific script types (i.e. `tr`, ‘wpkh’, ‘pkh’, ‘sh’, ‘sh(wpkh(…))’)
// Includes support for two kinds of inner descriptor patterns:
// Public descriptor: [abce1234/49h/0h/0h][extkey][key path])
// Private descriptor: [extkey][key path][key path]
// We further enforce this in the parseDescriptor function
const _checksumCharset: string = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

// Regex patterns from from: https://github.com/bitcoin/bitcoin/blob/master/doc/descriptors.md
// Hardened symbols: ' or h
const hardenedRegex: string = String.raw`([h'])`;
const wildcardRegex: string = String.raw`(\/\*)`;
// We limit the number of digits to at least 1 and capped at 2 for now
// Will still need to check if path valid (/44/..., /49/..., /84/...)
// NUM or NUM'
const numRegex: string = String.raw`([0-9]{1,2}${hardenedRegex}?)`;
// /NUM or /NUM'
const pathLevelRegex: string = String.raw`(\/${numRegex})`;
// /NUM/.../* or /NUM'/.../* (follows key)
const keyPathRegex: string = String.raw`(${pathLevelRegex}*${wildcardRegex}?)`;
// BIP32 8 hex characters for the fingerprint of the key
const fingerprintRegex: string = String.raw`([a-fA-F0-9]{8})`;
// [fingerprint/NUM/]
const keyOriginRegex: string = String.raw`(\[${fingerprintRegex}${pathLevelRegex}*\])`;
// Trailing checksum
const checksumRegex: string = String.raw`(#([${_checksumCharset}]+)?)`;

// Isolated regexes for each supported extended key
const xprvRegex: string = String.raw`([xyztuv]prv[1-9A-HJ-NP-Za-km-z]{79,108})`;
const xpubRegex: string = String.raw`([xyztuv]pub[1-9A-HJ-NP-Za-km-z]{79,108})`;

// Extended Key Regexes
const extendedKeyRegex: string = String.raw`(${xprvRegex}|${xpubRegex})`;

// [keyOrigin]xpub1234(keyPath)
const publicDescriptorRegex: string = String.raw`(${keyOriginRegex}+${extendedKeyRegex}${keyPathRegex}+)`;
// xprv1234(pathLevel)(keyPath)
const privateDescriptorRegex: string = String.raw`(${extendedKeyRegex}${pathLevelRegex}+${keyPathRegex}+)`;

// Each supported regex for the supported script types
export const p2trDescriptorRegex: string = String.raw`(tr\((${publicDescriptorRegex}|${privateDescriptorRegex})\)${checksumRegex}?)`;
export const wpkhDescriptorRegex: string = String.raw`(wpkh\((${publicDescriptorRegex}|${privateDescriptorRegex})\)${checksumRegex}?)`;
export const pkhDescriptorRegex: string = String.raw`(pkh\((${publicDescriptorRegex}|${privateDescriptorRegex})\)${checksumRegex}?)`;
export const shp2wpkhDescriptorRegex: string = String.raw`(sh\(wpkh\((${publicDescriptorRegex}|${privateDescriptorRegex})\)\)${checksumRegex}?)`;

// Combined general regex pattern for all supported script types
export const descriptorRegex: RegExp = RegExp(
    String.raw`^(${p2trDescriptorRegex}|${wpkhDescriptorRegex}|${pkhDescriptorRegex}|${shp2wpkhDescriptorRegex})$`,
);

// Extended Keys
export const extendedKeyPattern: RegExp = RegExp(
    String.raw`^(${xpubRegex}|${xprvRegex})$`,
);
export const extendedKeyPatternG: RegExp = RegExp(
    String.raw`(${xpubRegex}|${xprvRegex})`,
    'g',
);
export const xpubPattern: RegExp = RegExp(String.raw`^${xpubRegex}$`);
export const xprvPattern: RegExp = RegExp(String.raw`^${xprvRegex}$`);

// Bitcoin Address Regex
const legacyAddressRegex: string = String.raw`^(1|m)[A-HJ-NP-Za-km-z1-9]{25,33}$`; // pkh (26, 34)
const segwitWrappedRegex: string = String.raw`^(3|2)[A-HJ-NP-Za-km-z1-9]{25,34}$`; // sh(wpkh) (34)
const segwitNativeAddressRegex: string = String.raw`^(bc1q|tb1q)[a-z0-9]{38,58}$`; // wpkh (42, 62)
const taprootAddressRegex: string = String.raw`^(bc1p|tb1p)[a-z0-9]{58}$`; // p2tr (62)

// Combined regex for all supported address types
export const addressRegex: RegExp = RegExp(
    String.raw`(${legacyAddressRegex}|${segwitWrappedRegex}|${segwitNativeAddressRegex}|${taprootAddressRegex})`,
    'g',
);
