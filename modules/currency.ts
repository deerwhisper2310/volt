import BigNumber from 'bignumber.js';

import {TBalance, TFiatRate} from '../types/wallet';

const sourcesAPI = {
    coingecko: {
        url: 'https://api.coingecko.com/api/v3/simple/price',
    },
};

export const sourceNames = {
    CoinGecko: 'coingecko',
};

const APIFetcher = {
    // Default source is coingecko given currency ticker support
    coingecko: async (ticker: string): Promise<TBalance> => {
        const {url} = sourcesAPI.coingecko;

        let returnedJSON;

        try {
            const response = await fetch(
                `${url}?ids=bitcoin&vs_currencies=${ticker}`,
                {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            returnedJSON = await response.json();
        } catch (e: any) {
            throw new Error(
                `Error fetching rate for ${ticker.toUpperCase()} from CoinGecko: ${
                    e.message
                }`,
            );
        }

        try {
            const rate = returnedJSON?.bitcoin[ticker];

            return new BigNumber(rate);
        } catch (e: any) {
            const detailed_error =
                returnedJSON?.status.error_message.split('.')[0];
            const msg = detailed_error ? detailed_error : e.message;

            throw new Error(
                `Error parsing rate for ${ticker} from CoinGecko: ${msg}`,
            );
        }
    },
};

// Make single fire call to CoinGecko
const fetchPrice = async (ticker: string): Promise<TBalance> => {
    const response = await APIFetcher.coingecko(ticker.toLowerCase());

    // return fetched rate
    return response;
};

export const fetchFiatRate = async (
    ticker: string,
    fiatRate: TFiatRate,
    onSuccess: (rate: TBalance) => void,
    violate = false,
) => {
    const {lastUpdated} = fiatRate;

    // Same as Date.getTime()
    const currentTimestamp = +new Date();

    if (currentTimestamp - lastUpdated.getTime() <= 5 * 1000) {
        // Debounce
        console.info(
            '[FiatRate] Not updating fiat rate, last updated less than 5 seconds ago',
        );

        // Return false to indicate no update
        return false;
    }

    if (
        currentTimestamp - lastUpdated.getTime() <= 30 * 60 * 1000 &&
        !violate
    ) {
        // Avoid updating too frequently
        console.info(
            '[FiatRate] Not updating fiat rate, last updated less than 30 minutes ago',
        );

        // Return false to indicate no update
        return false;
    }

    try {
        // Grab data from remote source, i.e., CoinGecko
        const rate = await fetchPrice(ticker);

        // Trigger callback from RN component to update storage context
        await onSuccess(rate);

        // Return true to indicate success
        // i.e. rate fetched
        return true;
    } catch (e) {
        throw e;
    }
};
