/* eslint-disable react-hooks/exhaustive-deps */

import React, {useContext, useEffect, useState, useCallback} from 'react';

import {
    Platform,
    Text,
    useColorScheme,
    View,
    FlatList,
    Dimensions,
    StyleSheet,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation, CommonActions} from '@react-navigation/native';
import Carousel from 'react-native-reanimated-carousel';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {InitStackParamList} from '../Navigation';

import BDK from 'bdk-rn';
import BigNumber from 'bignumber.js';

import {useNetInfo} from '@react-native-community/netinfo';

import {useTailwind} from 'tailwind-rn';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../constants/Haptic';

import {AppStorageContext} from '../class/storageContext';

import {
    createBDKWallet,
    getBdkWalletBalance,
    getBdkWalletTransactions,
    syncBdkWallet,
} from '../modules/bdk';

import Dots from '../assets/svg/kebab-horizontal-24.svg';
import Add from '../assets/svg/plus-32.svg';

import Box from '../assets/svg/inbox-24.svg';

import Color from '../constants/Color';
import Font from '../constants/Font';

import {PlainButton} from '../components/button';
import {EmptyCard, WalletCard} from '../components/card';
import {TransactionListItem} from '../components/transaction';

import {BaseWallet} from '../class/wallet/base';
import {TBalance, TTransaction} from '../types/wallet';

import {FiatBalance} from '../components/balance';

import {fetchFiatRate} from '../modules/currency';
import {liberalAlert, conservativeAlert} from '../components/alert';

import {getUniqueTXs} from '../modules/wallet-utils';

type Props = NativeStackScreenProps<InitStackParamList, 'HomeScreen'>;

const Home = ({route}: Props) => {
    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const DarkGrayText = {
        color: ColorScheme.isDarkMode ? '#B8B8B8' : '#656565',
    };

    const DarkGreyText = {
        color: ColorScheme.isDarkMode ? '#4b4b4b' : '#DADADA',
    };

    const svgGrayFill = ColorScheme.isDarkMode ? '#4b4b4b' : '#DADADA';

    const topPlatformOffset = {
        marginTop: 6 + (Platform.OS === 'android' ? 12 : 0),
    };

    const navigation = useNavigation();

    const networkState = useNetInfo();

    const {
        wallets,
        hideTotalBalance,
        appFiatCurrency,
        currentWalletID,
        setCurrentWalletID,
        getWalletData,
        fiatRate,
        updateFiatRate,
        updateWalletTransactions,
        updateWalletBalance,
        isWalletInitialized,
        electrumServerURL,
        walletsIndex,
        updateWalletsIndex,
    } = useContext(AppStorageContext);

    const [refreshing, setRefreshing] = useState(false);
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [bdkWallet, setBdkWallet] = useState<BDK.Wallet>();

    // Set current wallet data
    const wallet = getWalletData(currentWalletID);

    const AppScreenWidth = Dimensions.get('window').width;

    // add the total balances of the wallets
    const totalBalance: TBalance = wallets.reduce(
        (accumulator: TBalance, currentValue: BaseWallet) =>
            // Only show balances from bitcoin mainnet
            // Don't want user tot think their testnet money
            // is spendable
            accumulator.plus(
                currentValue.network === 'bitcoin'
                    ? currentValue.balance
                    : new BigNumber(0),
            ),
        new BigNumber(0),
    );

    // List out all transactions across all wallets
    const extractAllTransactions = (): TTransaction[] => {
        let transactions: TTransaction[] = [];

        for (const w of wallets) {
            transactions = transactions.concat(w.transactions);
        }

        const txs = getUniqueTXs(transactions);

        // Sort by timestamp
        return txs.sort((a: TTransaction, b: TTransaction) => {
            return +b.timestamp - +a.timestamp;
        });
    };

    const initWallet = useCallback(async () => {
        const w = bdkWallet ? bdkWallet : await createBDKWallet(wallet);

        await syncBdkWallet(
            w,
            (status: boolean) => {
                console.log('[BDK] synced wallet', status);
            },
            wallet.network,
            electrumServerURL,
        );

        return w;
    }, []);

    // Fiat fetch
    const singleSyncFiatRate = useCallback(
        async (ticker: string, violate: boolean = false) => {
            // Only proceed if initial load or if user select new currency in settings
            if (violate) {
                try {
                    await fetchFiatRate(
                        ticker,
                        fiatRate,
                        (rate: TBalance) => {
                            updateFiatRate({
                                ...fiatRate,
                                rate: rate,
                                lastUpdated: new Date(),
                            });
                        },
                        violate,
                    );
                } catch (e: any) {
                    // Report network error
                    liberalAlert('Network', `${e.message}`, 'OK');

                    // Kill loading
                    setLoadingBalance(false);
                }

                // Kill loading
                setLoadingBalance(false);
            }
        },
        [],
    );

    // Refresh control
    const refreshWallet = useCallback(async () => {
        // Abort load if no wallets yet
        if (!isWalletInitialized) {
            return;
        }

        // Only attempt load if connected to network
        if (!networkState?.isInternetReachable) {
            setRefreshing(false);
            return;
        }

        // start loading
        setLoadingBalance(true);

        // Set refreshing
        setRefreshing(true);

        const w = await initWallet();

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
            console.info('[Fiat Rate] Did not fetch fiat rate');
        }

        // Check net again, just in case there is a drop mid execution
        if (!networkState?.isInternetReachable) {
            setRefreshing(false);
            return;
        }

        // Sync wallet
        const {balance} = await getBdkWalletBalance(w, wallet.balance);
        const {transactions} = await getBdkWalletTransactions(
            w,
            wallet.network === 'testnet'
                ? electrumServerURL.testnet
                : electrumServerURL.bitcoin,
        );

        // Kill refreshing
        setRefreshing(false);

        // Update wallet balance
        updateWalletBalance(currentWalletID, balance);

        // Update wallet transactions
        updateWalletTransactions(currentWalletID, transactions);

        // Kill loading
        setLoadingBalance(false);

        // set bdk wallet
        setBdkWallet(w);
    }, [
        setRefreshing,
        fiatRate,
        appFiatCurrency,
        updateFiatRate,
        networkState?.isInternetReachable,
    ]);

    // Fetch the fiat rate on currency change
    useEffect(() => {
        // Avoid fiat rate update call when offline
        // or when newly loaded screen to avoid dup call
        if (!networkState?.isInternetReachable) {
            return;
        }

        // Only call on each change to fiat currency in settings
        setLoadingBalance(true);
        singleSyncFiatRate(appFiatCurrency.short, true);
    }, [appFiatCurrency]);

    // Fetch the fiat rate on initial load
    useEffect(() => {
        // Only attempt update when initial fiat rate update call
        // and wallets exists
        if (wallets.length > 0) {
            // Avoid fiat rate update call when offline
            if (!networkState?.isInternetReachable) {
                return;
            }

            // Begin loading
            setLoadingBalance(true);

            // Single shot call to update fiat rate
            singleSyncFiatRate(appFiatCurrency.short);
        }

        () => {
            setRefreshing(false);
            setLoadingBalance(false);
        };
    }, []);

    useEffect(() => {
        if (route.params?.restoreMeta) {
            if (route.params?.restoreMeta.reload) {
                // Reload the wallet
                refreshWallet();
            }

            // Simple helper to show successful import and navigate back home
            conservativeAlert(
                route.params.restoreMeta.title,
                route.params.restoreMeta.message,
            );

            // Vibrate to let user know the action was successful
            RNHapticFeedback.trigger('impactLight', RNHapticFeedbackOptions);
        }
    }, [route.params?.restoreMeta]);

    const renderCard = ({item}: {item: BaseWallet}) => {
        return (
            <View style={[tailwind('w-full absolute')]}>
                {/* Avoid gesture handler triggering click event */}
                <WalletCard
                    maxedCard={
                        item.balance.isZero() && item.transactions.length > 0
                    }
                    balance={item.balance}
                    network={item.network}
                    isWatchOnly={item.isWatchOnly}
                    label={item.name}
                    walletBalance={item.balance}
                    walletType={item.type}
                    loading={loadingBalance}
                    hideBalance={hideTotalBalance}
                    unit={item.units}
                    navCallback={() => {
                        // Set the current wallet ID
                        setCurrentWalletID(item.id);

                        navigation.dispatch(
                            CommonActions.navigate('WalletRoot', {
                                screen: 'WalletView',
                            }),
                        );
                    }}
                />
            </View>
        );
    };

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind('h-full items-center justify-start relative'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View
                    style={[
                        tailwind(
                            'w-5/6 h-10 items-center flex-row justify-between',
                        ),
                        topPlatformOffset,
                    ]}>
                    <PlainButton
                        onPress={() =>
                            navigation.dispatch(
                                CommonActions.navigate({name: 'SettingsRoot'}),
                            )
                        }>
                        <Dots
                            width={32}
                            fill={ColorScheme.SVG.Default}
                            style={tailwind('-ml-1')}
                        />
                    </PlainButton>

                    {wallets.length > 0 ? (
                        <View
                            style={tailwind(
                                'flex-row justify-between items-center -mr-1',
                            )}>
                            <PlainButton
                                onPress={() =>
                                    navigation.dispatch(
                                        CommonActions.navigate('AddWalletRoot'),
                                    )
                                }>
                                <Add
                                    width={30}
                                    fill={ColorScheme.SVG.Default}
                                />
                            </PlainButton>
                        </View>
                    ) : (
                        <></>
                    )}
                </View>

                <View style={[tailwind('w-full h-full justify-around mt-2')]}>
                    <View
                        style={[
                            tailwind(
                                `w-5/6 self-center items-center justify-between ${
                                    !(wallets.length > 0) ? 'mb-4' : ''
                                }`,
                            ),
                        ]}>
                        <View
                            style={tailwind('justify-around w-full mt-3 mb-3')}>
                            {wallets.length > 0 ? (
                                <>
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-base font-medium mb-1',
                                            ),
                                            {color: ColorScheme.Text.Default},
                                            Font.RobotoText,
                                        ]}>
                                        Total Balance
                                    </Text>

                                    {!hideTotalBalance ? (
                                        <FiatBalance
                                            balance={totalBalance.toNumber()}
                                            loading={loadingBalance}
                                            balanceFontSize={'text-3xl'}
                                            fontColor={ColorScheme.Text.Default}
                                        />
                                    ) : (
                                        <View
                                            style={[
                                                tailwind(
                                                    'rounded-sm w-5/6 mt-1 opacity-80 h-8 flex-row items-center',
                                                ),
                                                {
                                                    backgroundColor:
                                                        ColorScheme.Background
                                                            .Greyed,
                                                },
                                            ]}
                                        />
                                    )}
                                </>
                            ) : (
                                <></>
                            )}
                        </View>

                        {/** Carousel for 'BaseCard */}
                        {wallets.length > 0 ? (
                            <View style={[styles.CardContainer]}>
                                <Carousel
                                    vertical={true}
                                    autoPlay={false}
                                    width={AppScreenWidth * 0.9}
                                    height={styles.CardContainer.height}
                                    data={[...wallets]}
                                    renderItem={renderCard}
                                    pagingEnabled={true}
                                    mode={'vertical-stack'}
                                    modeConfig={{
                                        snapDirection: 'left',
                                        stackInterval: 8,
                                    }}
                                    onScrollEnd={index => {
                                        updateWalletsIndex(index);
                                    }}
                                    defaultIndex={walletsIndex}
                                />
                            </View>
                        ) : (
                            <EmptyCard />
                        )}
                    </View>

                    <View
                        style={[
                            tailwind(
                                `w-full ${
                                    wallets.length > 0 ? 'h-3/5' : 'h-4/6'
                                } mt-8`,
                            ),
                        ]}>
                        <Text
                            style={[
                                tailwind('w-5/6 font-medium self-center'),
                                DarkGrayText,
                                Font.RobotoText,
                            ]}>
                            Latest Transactions
                        </Text>

                        <View
                            style={[
                                tailwind('w-full h-full items-center pb-20'),
                            ]}>
                            <FlatList
                                refreshing={refreshing}
                                onRefresh={refreshWallet}
                                scrollEnabled={true}
                                style={tailwind('w-full')}
                                contentContainerStyle={[
                                    tailwind(
                                        `${
                                            extractAllTransactions().length > 0
                                                ? 'w-11/12 self-center'
                                                : 'w-full h-full'
                                        } items-center`,
                                    ),
                                ]}
                                data={extractAllTransactions()}
                                renderItem={item => (
                                    <TransactionListItem
                                        callback={() => {
                                            navigation.dispatch(
                                                CommonActions.navigate(
                                                    'WalletRoot',
                                                    {
                                                        screen: 'TransactionDetails',
                                                        params: {
                                                            tx: {...item.item},
                                                            source: 'liberal',
                                                        },
                                                    },
                                                ),
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
                                                'w-5/6 h-5/6 items-center justify-center -mt-12',
                                            ),
                                        ]}>
                                        <Box
                                            width={32}
                                            fill={svgGrayFill}
                                            style={tailwind('mb-4')}
                                        />
                                        <Text
                                            style={[
                                                tailwind('w-5/6 text-center'),
                                                DarkGreyText,
                                                Font.RobotoText,
                                            ]}>
                                            A list of all latest transactions
                                            will be displayed here
                                        </Text>
                                    </View>
                                }
                            />
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    CardContainer: {
        height: 230,
    },
});

export default Home;
