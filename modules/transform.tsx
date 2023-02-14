const SATS_TO_BTC_RATE = 100_000_000;
const SEPARATOR = ' ';

export const addCommas = (num: string, separator: string = ',') => {
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
};

export const _getBTCfromSats = (sats: number) => {
    return sats / SATS_TO_BTC_RATE;
};

export const formatSats = (sats: number) => {
    // REM: Based on: https://bitcoin.design/guide/designing-products/units-and-symbols/
    if (sats < 0.1 && sats !== 0) {
        // Limit display to eight decimals
        // Anything lower is assumed to be an approximation
        // ... to zero
        if (sats < 0.00_000_001) {
            return `~${sats.toFixed(2)}`;
        }

        // Display in range of eight decimals (sats)
        return addCommas(sats.toFixed(8), SEPARATOR);
    }

    // If billions range of sats
    // We display with units
    if (sats > SATS_TO_BTC_RATE) {
        return formatWithUnits(sats);
    }

    // Strip trailing zeros
    return addCommas(sats.toString(), SEPARATOR);
};

export const formatBTC = (sats: number) => {
    // REM: Based on: https://bitcoin.design/guide/designing-products/units-and-symbols/
    const BTC = _getBTCfromSats(sats);

    // If below whole BTC, let's attempt to display that
    // in range of 11 decimals (msats)
    // However, if balance sub-msats,
    // indicate approximation with '~0.00'
    if (BTC < 0.1 && BTC !== 0) {
        if (BTC < 0.00_000_000_001) {
            return `~${BTC.toFixed(2)}`;
        }

        // Limit it to 1 sat - 1 milisats (11 decimals)
        return addCommas(BTC.toFixed(11), SEPARATOR);
    }

    return addCommas(BTC.toString(), SEPARATOR);
};

const formatWithUnits = (value: number) => {
    const RATE = 1000;
    // Screen can handle units for thousand and million
    // so we only snip to 'xxx.xx' when value is in Billion, Trillion, etc.
    const UNITS = ['', 'k', 'M', 'B', 'T', 'Q'];
    const DECIMAL = 2;
    const EXP = Math.floor(Math.log(value) / Math.log(RATE));
    const Limit = 1_000_000_000; // The displayable value limit (i.e. < 1B)

    if (value > Limit) {
        // Avoid Zero Division
        const p = value !== 0 ? value / Math.pow(RATE, EXP) : 0;
        const val = parseFloat(p.toString()).toFixed(DECIMAL);
        const unit = UNITS[EXP] || UNITS[1];

        // Return formatted value with units
        return `${val} ${unit}`;
    }

    // Return value as is, if below a billion
    return value.toFixed(2);
};

export const normalizeFiat = (sats: number, rate: number) => {
    // Get BTC to fiat value first
    const fiat = _getBTCfromSats(sats) * rate;

    // If below a cent, let's attempt to display that
    // 'Bullishly' speaking, Bitcoin will 'always' be worth more than a cent
    if (fiat < 0.01 && fiat !== 0) {
        // We just let them know it's less than a cent
        // So approximately a zero (insignificant)
        return `~${fiat.toFixed(2)}`;
    }

    // Amount in range of 100,000,000.00
    // (i.e. 14 digit characters)
    return addCommas(formatWithUnits(fiat));
};