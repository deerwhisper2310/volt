/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useContext, useEffect, useState} from 'react';
import {useColorScheme, View, Text, FlatList} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, CommonActions} from '@react-navigation/native';

import BdkRn from 'bdk-rn';
import BigNum from 'bignumber.js';
import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

Dayjs.extend(calendar);
Dayjs.extend(LocalizedFormat);

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import Dots from '../../assets/svg/kebab-horizontal-24.svg';
import Back from '../../assets/svg/arrow-left-24.svg';
import Box from '../../assets/svg/inbox-24.svg';

import {formatTXFromBDK} from '../../modules/wallet-utils';

import {PlainButton} from '../../components/button';

import {AppStorageContext} from '../../class/storageContext';

import {fetchFiatRate} from '../../modules/currency';

import {Balance} from '../../components/balance';

import {liberalAlert} from '../../components/alert';
import {TransactionListItem} from '../../components/transaction';

import {BalanceType, TransactionType} from '../../types/wallet';

const Wallet = () => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    // Get current wallet ID and wallet data
    const {
        currentWalletID,
        getWalletData,
        updateWalletTransactions,
        updateWalletBalance,
        networkState,
        fiatRate,
        appFiatCurrency,
        updateFiatRate,
    } = useContext(AppStorageContext);

    // For loading effect on balance
    const [loadingBalance, setLoadingBalance] = useState(
        networkState?.isConnected,
    );
    const [singleLoadLock, setSingleLoadLock] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Get current wallet data
    const walletData = getWalletData(currentWalletID);

    // Get card color from wallet type
    const CardColor = ColorScheme.WalletColors[walletData.type];

    const walletName = walletData.name;

    const syncWallet = useCallback(async () => {
        // Perform network check to avoid BDK native code error
        // Must be connected to network to use bdk-rn fns
        if (!networkState?.isConnected) {
            return;
        }

        // Create wallet from current wallet data
        const createResponse = await BdkRn.createWallet({
            mnemonic: walletData.secret ? walletData.secret : '',
            descriptor:
                walletData.descriptor && walletData.secret === ''
                    ? walletData.descriptor
                    : '',
            password: '',
            network: walletData.network,
        });

        // Report error from wallet creation function
        if (createResponse.error) {
            liberalAlert('Error', createResponse.data, 'OK');
        }

        // Sync wallet
        const syncResponse = await BdkRn.syncWallet();

        // report any sync errors
        if (syncResponse.error) {
            liberalAlert('Error', syncResponse.data, 'OK');
            return;
        }

        // Attempt call to get wallet balance
        const balanceResponse = await BdkRn.getBalance();

        if (balanceResponse.error) {
            // Report any errors in fetch attempt
            liberalAlert('Error', balanceResponse.data, 'OK');
            return;
        }

        // End loading and update value
        setLoadingBalance(false);

        // Update balance amount (in sats)
        // only update if balance different from stored version
        if (balanceResponse.data !== walletData.balance) {
            // Receive balance in sats as string
            // convert to BigNumber
            const balance = new BigNum(balanceResponse.data);
            updateWalletBalance(currentWalletID, balance);
        }

        // Update transactions list
        const transactionResponse = await BdkRn.getTransactions();

        if (transactionResponse.error) {
            liberalAlert(
                'Error',
                `Could not fetch transactions ${transactionResponse.error}`,
                'OK',
            );
        }

        const {confirmed, pending} = transactionResponse.data;
        const txs: TransactionType[] = [];

        // Update transactions list
        confirmed.forEach((transaction: any) => {
            txs.push(
                formatTXFromBDK({
                    confirmed: true,
                    network: walletData.network,
                    ...transaction,
                }),
            );
        });

        pending.forEach((transaction: any) => {
            txs.push(
                formatTXFromBDK({
                    confirmed: false,
                    network: walletData.network,
                    ...transaction,
                }),
            );
        });

        // Update wallet transactions
        updateWalletTransactions(currentWalletID, txs);
    }, [
        networkState?.isConnected,
        walletData.secret,
        walletData.descriptor,
        walletData.network,
        walletData.balance,
        updateWalletTransactions,
        currentWalletID,
        updateWalletBalance,
    ]);

    // Refresh control
    const onRefresh = useCallback(async () => {
        // Set refreshing
        setRefreshing(true);

        // Only attempt load if connected to network
        if (!networkState?.isConnected) {
            setRefreshing(false);
            return;
        }

        if (!loadingBalance) {
            setLoadingBalance(true);

            // Update wallet balance first
            await syncWallet();
        }

        const triggered = await fetchFiatRate(
            appFiatCurrency.short,
            fiatRate,
            (rate: BalanceType) => {
                // Then fetch fiat rate
                updateFiatRate({
                    ...fiatRate,
                    rate: rate,
                    lastUpdated: new Date(),
                });

                // Kill loading
                setRefreshing(false);
                setLoadingBalance(false);
            },
        );

        // Kill loading if fiat rate fetch not triggered
        if (!triggered) {
            setRefreshing(false);
            setLoadingBalance(false);
        }
    }, [
        setRefreshing,
        syncWallet,
        loadingBalance,
        fiatRate,
        appFiatCurrency,
        updateFiatRate,
        networkState?.isConnected,
    ]);

    useEffect(() => {
        // Attempt to sync balance
        if (!singleLoadLock) {
            syncWallet();
            setSingleLoadLock(true);
        }
    }, [syncWallet, setSingleLoadLock, singleLoadLock]);

    // Receive Wallet ID and fetch wallet data to display
    // Include functions to change individual wallet settings
    return (
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Default},
            ]}>
            {/* adjust styling below to ensure content in View covers entire screen */}
            {/* Adjust styling below to ensure it covers entire app height */}
            <View style={[tailwind('w-full h-full')]}>
                {/* Top panel */}
                <View
                    style={[
                        tailwind('relative h-1/3 rounded-b-2xl'),
                        {backgroundColor: CardColor},
                    ]}>
                    <View
                        style={[
                            tailwind(
                                'absolute w-full top-4 flex-row justify-between',
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
                    {walletData.isWatchOnly ? (
                        <View style={[tailwind('absolute top-12 right-6')]}>
                            <Text
                                style={[
                                    tailwind(
                                        'text-sm py-1 px-2 self-center text-white font-bold bg-black rounded opacity-40',
                                    ),
                                ]}>
                                Watch-only
                            </Text>
                        </View>
                    ) : (
                        <></>
                    )}

                    {/* Balance */}
                    <View
                        style={[
                            tailwind('absolute self-center w-5/6 bottom-28'),
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm text-white opacity-60 mb-1'),
                            ]}>
                            {!networkState?.isConnected ? 'Offline ' : ''}
                            Balance
                        </Text>

                        {/* Balance component */}
                        <View
                            style={[
                                tailwind(
                                    `${loadingBalance ? 'opacity-40' : ''}`,
                                ),
                            ]}>
                            <Balance
                                id={currentWalletID}
                                BalanceFontSize={'text-4xl'}
                                fiatRate={fiatRate}
                                disableFiat={false}
                            />
                        </View>
                    </View>

                    {/* Send and receive */}
                    <View
                        style={[
                            tailwind(
                                'absolute bottom-4 w-full items-center px-4 justify-around flex-row mt-4 mb-4',
                            ),
                        ]}>
                        {!walletData.isWatchOnly ? (
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
                                <PlainButton>
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-base text-center font-bold',
                                            ),
                                            {color: ColorScheme.Text.Alt},
                                        ]}>
                                        Send
                                    </Text>
                                </PlainButton>
                            </View>
                        ) : (
                            <></>
                        )}
                        <View
                            style={[
                                tailwind(
                                    `rounded-full py-3 ${
                                        walletData.isWatchOnly
                                            ? 'w-5/6'
                                            : 'w-1/2'
                                    } opacity-60`,
                                ),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Inverted,
                                },
                            ]}>
                            <PlainButton>
                                <Text
                                    style={[
                                        tailwind(
                                            'text-base text-center font-bold',
                                        ),
                                        {color: ColorScheme.Text.Alt},
                                    ]}>
                                    Receive
                                </Text>
                            </PlainButton>
                        </View>
                    </View>

                    {/* Bottom line divider */}
                    <View
                        style={[
                            tailwind(
                                'w-16 h-1 absolute bottom-2 rounded-full self-center opacity-40',
                            ),
                            {backgroundColor: ColorScheme.Background.Inverted},
                        ]}
                    />
                </View>

                {/* Transactions List */}
                <View style={[tailwind('h-2/3 w-full items-center')]}>
                    <View style={[tailwind('mt-6 w-11/12')]}>
                        <Text
                            style={[
                                tailwind('text-lg font-bold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Transactions
                        </Text>
                    </View>

                    <View style={[tailwind('w-full h-full items-center')]}>
                        {walletData.transactions.length === 0 ? (
                            <View
                                style={[
                                    tailwind(
                                        'flex mt-6 justify-around text-justify h-5/6 items-center justify-center',
                                    ),
                                ]}>
                                <Box
                                    width={32}
                                    fill={ColorScheme.SVG.GrayFill}
                                    style={tailwind('mb-4 -mt-6')}
                                />
                                <Text
                                    style={[
                                        tailwind('w-3/5 text-center'),
                                        {color: ColorScheme.Text.GrayedText},
                                    ]}>
                                    A list of all transactions for this wallet
                                    be displayed here
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                scrollEnabled={true}
                                style={tailwind('w-11/12 mt-4 mb-12')}
                                data={walletData.transactions}
                                renderItem={item => (
                                    <TransactionListItem
                                        fiatRate={fiatRate}
                                        tx={item.item}
                                    />
                                )}
                                keyExtractor={item => item.txid}
                                initialNumToRender={25}
                                contentInsetAdjustmentBehavior="automatic"
                            />
                        )}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Wallet;
