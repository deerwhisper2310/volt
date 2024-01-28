/* eslint-disable react-hooks/exhaustive-deps */

import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
    useColorScheme,
    View,
    Text,
    FlatList,
    StatusBar,
    StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, CommonActions} from '@react-navigation/native';

import VText from '../../components/text';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import BDK from 'bdk-rn';

import BigNumber from 'bignumber.js';

import {useNetInfo} from '@react-native-community/netinfo';

import {useTranslation} from 'react-i18next';

import {getTxData} from '../../modules/mempool';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import Dots from '../../assets/svg/kebab-horizontal-24.svg';
import Back from '../../assets/svg/arrow-left-24.svg';
import Box from '../../assets/svg/inbox-24.svg';

import {
    syncBdkWallet,
    getBdkWalletBalance,
    createBDKWallet,
    getBdkWalletTransactions,
} from '../../modules/bdk';
import {
    getMiniWallet,
    checkNetworkIsReachable,
} from '../../modules/wallet-utils';

import {PlainButton} from '../../components/button';

import {AppStorageContext} from '../../class/storageContext';

import {fetchFiatRate} from '../../modules/currency';

import {Balance} from '../../components/balance';

import {liberalAlert} from '../../components/alert';
import {TransactionListItem} from '../../components/transaction';

import {TBalance, TTransaction} from '../../types/wallet';

import {capitalizeFirst} from '../../modules/transform';

type Props = NativeStackScreenProps<WalletParamList, 'WalletView'>;

const Wallet = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const {t, i18n} = useTranslation('wallet');
    const {t: e} = useTranslation('errors');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const [bdkWallet, setBdkWallet] = useState<BDK.Wallet>();

    const networkState = useNetInfo();

    // Get current wallet ID and wallet data
    const {
        setLoadLock,
        currentWalletID,
        getWalletData,
        fiatRate,
        appFiatCurrency,
        updateFiatRate,
        updateWalletBalance,
        updateWalletTransactions,
        updateWalletUTXOs,
        hideTotalBalance,
        updateWalletAddress,
        electrumServerURL,
    } = useContext(AppStorageContext);

    // For loading effect on balance
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Get current wallet data
    const walletData = getWalletData(currentWalletID);

    // Get card color from wallet type
    const CardColor =
        ColorScheme.WalletColors[walletData.type][walletData.network];

    const walletName = walletData.name;

    const initWallet = useCallback(async () => {
        const w = await createBDKWallet(walletData);

        return w;
    }, []);

    const syncWallet = useCallback(async () => {
        // initWallet only called one time
        // subsequent call is from 'bdkWallet' state
        // set in Balance fetch
        const w = bdkWallet ? bdkWallet : await initWallet();

        const W = await syncBdkWallet(
            w,
            () => {},
            walletData.network,
            electrumServerURL,
        );

        return W;
    }, []);

    // Refresh control
    const refreshWallet = useCallback(async () => {
        // Avoid duplicate loading
        if (refreshing || loadingBalance) {
            return;
        }

        // Only attempt load if connected to network
        if (!checkNetworkIsReachable(networkState)) {
            setRefreshing(false);
            return;
        }

        // Lock load to avoid deleting wallet while loading
        setLoadLock(true);

        // Set refreshing
        setRefreshing(true);
        setLoadingBalance(true);

        const w = await syncWallet();

        try {
            const triggered = await fetchFiatRate(
                appFiatCurrency.short,
                fiatRate,
                (rate: TBalance) => {
                    // Then fetch fiat rate
                    updateFiatRate({
                        ...fiatRate,
                        rate: rate,
                        lastUpdated: new Date(),
                    });
                },
            );

            if (!triggered) {
                console.log('[Fiat Rate] Did not fetch fiat rate');
            }
        } catch (err: any) {
            liberalAlert(
                capitalizeFirst(t('network')),
                e('failed_to_fetch_rate'),
                capitalizeFirst(t('ok')),
            );

            console.log('[Fiat Rate] Error fetching fiat rate', err.message);

            setLoadingBalance(false);
            setRefreshing(false);
            return;
        }

        if (!loadingBalance) {
            // Update wallet balance first
            const {balance, updated} = await getBdkWalletBalance(
                w,
                walletData.balance,
            );

            // update wallet balance
            updateWalletBalance(currentWalletID, balance);

            try {
                const {transactions, UTXOs} = await getBdkWalletTransactions(
                    w,
                    walletData.network === 'testnet'
                        ? electrumServerURL.testnet
                        : electrumServerURL.bitcoin,
                );

                // Store newly formatted transactions from mempool.space data
                const newTxs = updated ? [] : transactions;

                const addressLock = !updated;

                let tempReceiveAddress = walletData.address;
                let addressIndexCount = walletData.index;

                // Only attempt wallet address update if wallet balance is updated
                // TODO: avoid mempool for now and scrap this from BDK raw tx info (Script)
                if (updated) {
                    // iterate over all the transactions and include the missing optional fields for the TTransaction
                    for (let i = 0; i < transactions.length; i++) {
                        const tmp: TTransaction = {
                            ...transactions[i],
                            address: '',
                        };

                        const TxData = await getTxData(
                            transactions[i].txid,
                            transactions[i].network,
                        );

                        // Transaction inputs (remote owned addresses)
                        for (let j = 0; j < TxData.vin.length; j++) {
                            // Add address we own based on whether we sent
                            // the transaction and the value received matches
                            if (
                                transactions[i].value ===
                                    TxData.vin[j].prevout.value &&
                                transactions[i].type === 'outbound'
                            ) {
                                tmp.address =
                                    TxData.vin[j].prevout.scriptpubkey_address;
                            }

                            // Check if receive address is used
                            // Then push tx index
                            if (
                                TxData.vin[j].prevout.scriptpubkey_address ===
                                walletData.address.address
                            ) {
                                walletData.generateNewAddress();
                            }
                        }

                        // Transaction outputs (local owned addresses)
                        for (let k = 0; k < TxData.vout.length; k++) {
                            // Add address we own based on whether we received
                            // the transaction and the value received matches
                            if (
                                transactions[i].value ===
                                    TxData.vout[k].value &&
                                transactions[i].type === 'inbound'
                            ) {
                                tmp.address =
                                    TxData.vout[k].scriptpubkey_address;

                                // Update temp address
                                if (
                                    !addressLock &&
                                    walletData.address.address ===
                                        TxData.vout[k].scriptpubkey_address
                                ) {
                                    tempReceiveAddress =
                                        walletData.generateNewAddress(
                                            addressIndexCount,
                                        );
                                    addressIndexCount++;
                                }
                            }
                        }

                        // Update new transactions list
                        newTxs.push({...tmp});
                    }

                    // update wallet address
                    updateWalletAddress(currentWalletID, tempReceiveAddress);
                }

                // We make this update in case of pending txs
                // and because we already have this data from the balance update BDK call
                // update wallet transactions
                updateWalletTransactions(currentWalletID, newTxs);

                // update wallet UTXOs
                updateWalletUTXOs(currentWalletID, UTXOs);

                setLoadLock(false);
            } catch (err: any) {
                liberalAlert(
                    capitalizeFirst(t('network')),
                    e('error_fetching_txs'),
                    capitalizeFirst(t('ok')),
                );

                setLoadingBalance(false);
                setRefreshing(false);
                setLoadLock(false);
                return;
            }
        }

        // Kill loading if fiat rate fetch not triggered
        setRefreshing(false);
        setLoadingBalance(false);
        setLoadLock(false);

        // Update wallet, so we avoid wallet creation
        // for every call to this function
        if (!bdkWallet) {
            setBdkWallet(w);
        }
    }, [
        appFiatCurrency.short,
        currentWalletID,
        fiatRate,
        loadingBalance,
        networkState,
        refreshing,
        updateFiatRate,
        updateWalletBalance,
        updateWalletTransactions,
        walletData,
    ]);

    // Check if wallet balance is empty
    const isWalletBroke = (balance: BigNumber) => {
        return new BigNumber(0).eq(balance);
    };

    const hideSendButton =
        walletData.isWatchOnly || isWalletBroke(walletData.balance);

    useEffect(() => {
        // Kill all loading effects
        () => {
            setRefreshing(false);
            setLoadingBalance(false);
            setLoadLock(false);
        };
    }, []);

    useEffect(() => {
        // Attempt to sync balance when reload triggered
        // E.g. from completed transaction
        if (route.params?.reload) {
            refreshWallet();
        }
    }, [route.params?.reload]);

    // Receive Wallet ID and fetch wallet data to display
    // Include functions to change individual wallet settings
    return (
        <SafeAreaView
            style={[
                styles.root,
                {backgroundColor: ColorScheme.Background.Primary},
            ]}>
            {/* status bar filler */}
            <StatusBar barStyle={'light-content'} backgroundColor={CardColor} />
            <View
                style={[
                    tailwind('absolute w-full h-16 top-0'),
                    {backgroundColor: CardColor},
                ]}
            />
            {/* adjust styling below to ensure content in View covers entire screen */}
            {/* Adjust styling below to ensure it covers entire app height */}
            <View
                style={[
                    tailwind('w-full h-full'),
                    {backgroundColor: CardColor},
                ]}>
                {/* Top panel */}
                <View
                    style={[
                        tailwind('relative h-1/2 items-center justify-center'),
                        {backgroundColor: CardColor},
                    ]}>
                    <View
                        style={[
                            tailwind(
                                'absolute w-full top-2 flex-row items-center justify-between',
                            ),
                        ]}>
                        <PlainButton
                            style={[tailwind('items-center flex-row left-6')]}
                            onPress={() => {
                                navigation.dispatch(
                                    CommonActions.navigate('HomeScreen'),
                                );
                            }}>
                            <Back style={tailwind('mr-2')} fill={'white'} />
                        </PlainButton>

                        <Text
                            style={[
                                tailwind(
                                    'text-white self-center text-center w-1/2 font-bold',
                                ),
                            ]}
                            numberOfLines={1}
                            ellipsizeMode={'middle'}>
                            {walletName}
                        </Text>

                        <PlainButton
                            style={[tailwind('right-6')]}
                            onPress={() => {
                                navigation.dispatch(
                                    CommonActions.navigate({
                                        name: 'WalletInfo',
                                    }),
                                );
                            }}>
                            <Dots width={32} fill={'white'} />
                        </PlainButton>
                    </View>

                    {/* Watch-only */}
                    {walletData.isWatchOnly && (
                        <View
                            style={[
                                tailwind(
                                    'absolute top-11 rounded-full bg-black opacity-50',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind(
                                        'text-sm py-1 px-6 text-white font-bold',
                                    ),
                                ]}>
                                {t('watch_only')}
                            </Text>
                        </View>
                    )}

                    {/* Balance */}
                    <View
                        style={[
                            tailwind(
                                `items-center w-5/6 ${
                                    hideTotalBalance ? '-mt-20' : '-mt-8'
                                }`,
                            ),
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm text-white opacity-60 mb-2'),
                            ]}>
                            {!checkNetworkIsReachable(networkState)
                                ? t('offline_balance')
                                : t('current_balance')}
                        </Text>

                        {/* Balance component */}
                        <View
                            style={[
                                tailwind(
                                    `${
                                        hideTotalBalance
                                            ? 'absolute mt-8'
                                            : 'items-center'
                                    } w-full`,
                                ),
                            ]}>
                            <Balance
                                fontColor={'white'}
                                balance={walletData.balance}
                                balanceFontSize={'text-4xl'}
                                disableFiat={false}
                                loading={loadingBalance}
                            />
                        </View>
                    </View>

                    {/* Send and receive */}
                    <View
                        style={[
                            tailwind(
                                'absolute bottom-6 w-full items-center px-4 justify-around flex-row',
                            ),
                        ]}>
                        {/* Hide send if Balance is empty or it is a watch-only wallet */}
                        {!hideSendButton && (
                            <View
                                style={[
                                    tailwind(
                                        'rounded-full py-3 mr-4 w-1/2 opacity-60',
                                    ),
                                    {
                                        backgroundColor:
                                            ColorScheme.Background.Inverted,
                                    },
                                ]}>
                                <PlainButton
                                    onPress={() => {
                                        const miniwallet =
                                            getMiniWallet(walletData);

                                        navigation.dispatch(
                                            CommonActions.navigate('ScanRoot', {
                                                screen: 'Scan',
                                                params: {
                                                    screen: 'send',
                                                    wallet: miniwallet,
                                                },
                                            }),
                                        );
                                    }}>
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-base text-center font-bold',
                                            ),
                                            {color: ColorScheme.Text.Alt},
                                        ]}>
                                        {capitalizeFirst(t('send'))}
                                    </Text>
                                </PlainButton>
                            </View>
                        )}
                        <View
                            style={[
                                tailwind(
                                    `rounded-full py-3 ${
                                        hideSendButton ? 'w-full' : 'w-1/2'
                                    } opacity-60`,
                                ),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Inverted,
                                },
                            ]}>
                            <PlainButton
                                onPress={() => {
                                    navigation.dispatch(
                                        CommonActions.navigate({
                                            name: 'RequestAmount',
                                        }),
                                    );
                                }}>
                                <Text
                                    style={[
                                        tailwind(
                                            'text-base text-center font-bold',
                                        ),
                                        {color: ColorScheme.Text.Alt},
                                    ]}>
                                    {capitalizeFirst(t('receive'))}
                                </Text>
                            </PlainButton>
                        </View>
                    </View>
                </View>

                {/* Transactions List */}
                <View
                    style={[
                        styles.transactionList,
                        tailwind('h-1/2 w-full items-center z-10'),
                        {
                            backgroundColor: ColorScheme.Background.Primary,
                        },
                    ]}>
                    <View style={[tailwind('mt-6 w-11/12')]}>
                        <VText
                            style={[
                                tailwind(
                                    `${
                                        langDir === 'right' ? 'mr-4' : 'ml-4'
                                    } text-base font-bold`,
                                ),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {capitalizeFirst(t('transactions'))}
                        </VText>
                    </View>

                    <View
                        style={[tailwind('w-full h-full items-center pb-10')]}>
                        <FlatList
                            refreshing={refreshing}
                            onRefresh={refreshWallet}
                            scrollEnabled={true}
                            style={[
                                tailwind(
                                    `${
                                        walletData.transactions.length > 0
                                            ? 'w-11/12'
                                            : 'w-full'
                                    } mt-2 z-30`,
                                ),
                            ]}
                            contentContainerStyle={[
                                tailwind(
                                    `${
                                        walletData.transactions.length > 0
                                            ? ''
                                            : 'h-full'
                                    } items-center`,
                                ),
                            ]}
                            data={walletData.transactions.sort(
                                (a: TTransaction, b: TTransaction) => {
                                    return +b.timestamp - +a.timestamp;
                                },
                            )}
                            renderItem={item => (
                                <TransactionListItem
                                    callback={() => {
                                        navigation.dispatch(
                                            CommonActions.navigate({
                                                name: 'TransactionDetails',
                                                params: {
                                                    tx: {...item.item},
                                                    source: 'conservative',
                                                    walletId: currentWalletID,
                                                },
                                            }),
                                        );
                                    }}
                                    tx={item.item}
                                />
                            )}
                            keyExtractor={item => item.txid}
                            initialNumToRender={25}
                            contentInsetAdjustmentBehavior="automatic"
                            ListEmptyComponent={
                                <View
                                    style={[
                                        tailwind(
                                            'w-4/5 h-5/6 items-center justify-center',
                                        ),
                                    ]}>
                                    <Box
                                        width={32}
                                        fill={ColorScheme.SVG.GrayFill}
                                        style={tailwind('mb-4 -mt-6')}
                                    />
                                    <Text
                                        style={[
                                            tailwind('w-full text-center'),
                                            {
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                            },
                                        ]}>
                                        {t('no_transactions_text')}
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Wallet;

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    transactionList: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
});
