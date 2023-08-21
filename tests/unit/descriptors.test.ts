// Tests to check that descriptors are imported and generated correctly
import {
    parseDescriptor,
    createDescriptorFromXprv,
    createDescriptorfromString,
} from './../../modules/descriptors';
import {descriptorRegex} from '../../modules/re';

describe('testing descriptor checksum extraction', () => {
    test('descriptor checksum matches', () => {
        const descriptor =
            "wpkh([c65d79d8/84'/0'/0']xpub6CmNYqKyLZdq1BsTyixhuNkKoa3Dt6J9pgUXjA742t7b44xAwjXZak6GvYBPda15ZqKkWippbVkCHYvHMQGuuhVsu2ohkgaVioYcNxZmEvH/0/*)#ur90lsda";
        const descriptor_checksum = '#ur90lsda';

        const parts = parseDescriptor(descriptor);

        expect(parts.checksum).toBe(descriptor_checksum);
    });
});

describe('testing descriptor fingerprint extraction', () => {
    test('descriptor fingerprint matches', () => {
        const descriptor =
            'wpkh([188ed79c/84h/1h/0h]tpubD6NzVbkrYhZ4XopgwuDUxX9FnNeZUfidCDusmRfUkzLaVKY2zNNYtqj1frtBbqTSBcHKxsbtUjD4WSDGBwiMn7mLuuWEf5WzvJKMamGNGgG/0/*)';
        const descriptor_fingerprint = '188ed79c';

        const parts = parseDescriptor(descriptor);

        expect(parts.fingerprint).toBe(descriptor_fingerprint);
    });
});

// Exhaust all the different descriptor formats we accept in the app
describe('testing descriptor regex allowed patterns', () => {
    test('descriptor regex tests passed', () => {
        /** Accepted descriptors
         *
         * Note: checksum is optional
         * external BDK public descriptor wpkh([d34db33f/84'/1'/0']tpub.../0/*)#checksum
         * private BDK public descriptor wpkh(tpub.../84'/0'/0'/0/*)#checksum
         **/

        const descriptorsList: [string, boolean][] = [
            // Old style descriptor (vague descriptor)
            [
                'wpkh(tpubD6NzVbkrYhZ4XopgwuDUxX9FnNeZUfidCDusmRfUkzLaVKY2zNNYtqj1frtBbqTSBcHKxsbtUjD4WSDGBwiMn7mLuuWEf5WzvJKMamGNGgG)',
                false,
            ],
            // public descriptor fingerprint + origin path + key path
            [
                "pkh([d34db33f/44'/0'/0']xpub6ERApfZwUNrhLCkDtcHTcxd75RbzS1ed54G1LkBUHQVHQKqhMkhgbmJbZRkrgZw4koxb5JaHWkY4ALHY2grBGRjaDMzQLcgJvLJuZZvRcEL/1/*)",
                true,
            ],
            // public descriptor + fingerprint + origin path
            [
                'wpkh([188ed79c/84h/1h/0h]tpubD6NzVbkrYhZ4XopgwuDUxX9FnNeZUfidCDusmRfUkzLaVKY2zNNYtqj1frtBbqTSBcHKxsbtUjD4WSDGBwiMn7mLuuWEf5WzvJKMamGNGgG)',
                true,
            ],
            // public descriptor + fingerprint + path + key path + checksum (generated by BDK)
            [
                "wpkh([c65d79d8/84'/0'/0']xpub6CmNYqKyLZdq1BsTyixhuNkKoa3Dt6J9pgUXjA742t7b44xAwjXZak6GvYBPda15ZqKkWippbVkCHYvHMQGuuhVsu2ohkgaVioYcNxZmEvH/0/*)#ur90lsda",
                true,
            ],
            // private descriptor + trailing path + key path + checksum (generated by BDK)
            [
                "wpkh(tprv8gVTXwc2o1FPtn2LiM7nuHJXZzCskz4D7nTHs6kEgCzukTYydTDfrUe4CkJhPfTVcEaCSZPgWTyL6i3wGsbvF6i87Mea89YdwYamM277nrr/84'/1'/0'/0/*)#wcm6z32h",
                true,
            ],
        ];

        // Wrapped Descriptors
        const wrappedDescriptorsList: [string, boolean][] = [
            // Old descriptor (from older descriptor)
            [
                'sh(wpkh(tpubDDiPyw7zazwzTRbs5WBLm7iRzxbgudBnzf7xMuUoxbNPTz1HwFtVVqwqMjkqMGkSaq89KguWaHytTgiyDoTBMoX7P2N95cnuWR1A9Cnwmz7))',
                false,
            ],
            // Public Descriptor + fingerprint + origin path + key path
            [
                "sh(wpkh([54cb71c5/49'/1'/0']tpubDDiPyw7zazwzTRbs5WBLm7iRzxbgudBnzf7xMuUoxbNPTz1HwFtVVqwqMjkqMGkSaq89KguWaHytTgiyDoTBMoX7P2N95cnuWR1A9Cnwmz7/0/*))",
                true,
            ],
            // Public Descriptor + fingerprint + path + key path + checksum (generated by BDK)
            [
                "sh(wpkh([54cb71c5/49'/1'/0']tpubDDiPyw7zazwzTRbs5WBLm7iRzxbgudBnzf7xMuUoxbNPTz1HwFtVVqwqMjkqMGkSaq89KguWaHytTgiyDoTBMoX7P2N95cnuWR1A9Cnwmz7/0/*))#hdklzyg8",
                true,
            ],
            // Private Descriptor + path + key path + checksum (generated by BDK)
            [
                "sh(wpkh(tprv8ZgxMBicQKsPdswRD9ZszsBTcBkBYnmncuuLSJH92UJYhxDmPiuGyVnUAUS8koCu3KmvL9Eo815MoBqB51VsFir6mzPkLVokXpkqVWjqFxW/49'/1'/0'/0/*))#ag9fhs2q",
                true,
            ],
            // Private Descriptor + path + origin path
            [
                "sh(wpkh(tprv8ZgxMBicQKsPdswRD9ZszsBTcBkBYnmncuuLSJH92UJYhxDmPiuGyVnUAUS8koCu3KmvL9Eo815MoBqB51VsFir6mzPkLVokXpkqVWjqFxW/49'/1'/0'))",
                true,
            ],
        ];

        for (const descriptor of descriptorsList) {
            expect(descriptorRegex.test(descriptor[0])).toBe(descriptor[1]);
        }

        for (const descriptor1 of wrappedDescriptorsList) {
            expect(descriptorRegex.test(descriptor1[0])).toBe(descriptor1[1]);
        }
    });
});

// check descriptor parts
describe('testing parsed descriptor parts', () => {
    test('descriptor parts tests passed', () => {
        const descriptor =
            "wpkh([c65d79d8/84'/0'/0']xpub6CmNYqKyLZdq1BsTyixhuNkKoa3Dt6J9pgUXjA742t7b44xAwjXZak6GvYBPda15ZqKkWippbVkCHYvHMQGuuhVsu2ohkgaVioYcNxZmEvH/0/*)#ur90lsda";
        const parsedDescriptor = parseDescriptor(descriptor);

        expect(parsedDescriptor.type).toEqual('wpkh');
        expect(parsedDescriptor.network).toEqual('bitcoin');
        expect(parsedDescriptor.keyPath).toEqual('/0/*');
        expect(parsedDescriptor.path.replace(/'/g, 'h')).toEqual('m/84h/0h/0h');
        expect(parsedDescriptor.fingerprint).toEqual('c65d79d8');
    });
});

describe('generated descriptor from string', () => {
    test('descriptor from string tests passed', () => {
        const descriptorExternal =
            "wpkh([c65d79d8/84'/0'/0']xpub6CmNYqKyLZdq1BsTyixhuNkKoa3Dt6J9pgUXjA742t7b44xAwjXZak6GvYBPda15ZqKkWippbVkCHYvHMQGuuhVsu2ohkgaVioYcNxZmEvH/0/*)#ur90lsda";
        const descriptorInternal =
            "wpkh([c65d79d8/84'/0'/0']xpub6CmNYqKyLZdq1BsTyixhuNkKoa3Dt6J9pgUXjA742t7b44xAwjXZak6GvYBPda15ZqKkWippbVkCHYvHMQGuuhVsu2ohkgaVioYcNxZmEvH/1/*)#dhqwz9a9";

        const {internal, external} =
            createDescriptorfromString(descriptorExternal);

        expect(external).toEqual(descriptorExternal);
        expect(internal).toEqual(descriptorInternal);
    });
});

describe('generated descriptor from xprv', () => {
    test('descriptor from xprv tests passed', () => {
        const xprv =
            'tprv8gVTXwc2o1FPtn2LiM7nuHJXZzCskz4D7nTHs6kEgCzukTYydTDfrUe4CkJhPfTVcEaCSZPgWTyL6i3wGsbvF6i87Mea89YdwYamM277nrr';

        const descriptorExternal =
            "wpkh(tprv8gVTXwc2o1FPtn2LiM7nuHJXZzCskz4D7nTHs6kEgCzukTYydTDfrUe4CkJhPfTVcEaCSZPgWTyL6i3wGsbvF6i87Mea89YdwYamM277nrr/84'/1'/0'/0/*)#wcm6z32h";
        const descriptorInternal =
            "wpkh(tprv8gVTXwc2o1FPtn2LiM7nuHJXZzCskz4D7nTHs6kEgCzukTYydTDfrUe4CkJhPfTVcEaCSZPgWTyL6i3wGsbvF6i87Mea89YdwYamM277nrr/84'/1'/0'/1/*)#lv7mly60";

        const {internal, external} = createDescriptorFromXprv(xprv);

        expect(external).toEqual(descriptorExternal);
        expect(internal).toEqual(descriptorInternal);
    });
});
