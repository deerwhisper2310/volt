/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */

import React, {
    useContext,
    useState,
    useEffect,
    useMemo,
    useReducer,
    ReactElement,
    useCallback,
    useRef,
} from 'react';
import {
    useColorScheme,
    View,
    Text,
    Share,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';

import {
    useNavigation,
    CommonActions,
    StackActions,
} from '@react-navigation/native';

import {receivePayment, LnInvoice} from '@breeztech/react-native-breez-sdk';

import Carousel, {ICarouselInstance} from 'react-native-reanimated-carousel';

import ExpiryTimer from '../../components/expiry';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import {SafeAreaView} from 'react-native-safe-area-context';

import BigNumber from 'bignumber.js';

import {useTailwind} from 'tailwind-rn';

import {useTranslation} from 'react-i18next';

import {
    addCommas,
    capitalizeFirst,
    formatFiat,
    SATS_TO_BTC_RATE,
} from '../../modules/transform';

import Color from '../../constants/Color';

import {AppStorageContext} from '../../class/storageContext';

import QRCodeStyled from 'react-native-qrcode-styled';
import Close from '../../assets/svg/x-24.svg';

import {
    DisplayFiatAmount,
    DisplaySatsAmount,
    DisplayBTCAmount,
} from '../../components/balance';

import ShareIcon from '../../assets/svg/share-android-24.svg';

import Clipboard from '@react-native-clipboard/clipboard';

import {PlainButton} from '../../components/button';

import NativeDims from '../../constants/NativeWindowMetrics';
import {useSharedValue} from 'react-native-reanimated';

// Prop type for params passed to this screen
// from the RequestAmount screen
type Props = NativeStackScreenProps<WalletParamList, 'Receive'>;
type Slide = () => ReactElement;

const Receive = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const navigation = useNavigation();

    const {t} = useTranslation('wallet');

    const {currentWalletID, getWalletData, isAdvancedMode} =
        useContext(AppStorageContext);
    const walletData = getWalletData(currentWalletID);
    const isLNWallet = walletData.type === 'unified';

    const progressValue = useSharedValue(0);
    const [loadingInvoice, setLoadingInvoice] = useState(
        walletData.type === 'unified',
    );
    const [LNInvoice, setLNInvoice] = useState<LnInvoice>();

    const initialState = {
        // Amount in sats
        bitcoinValue: new BigNumber(0),
        fiatValue: new BigNumber(0),
    };

    const reducer = (state: any, action: any) => {
        switch (action.type) {
            case 'SET_BITCOIN_VALUE':
                return {
                    ...state,
                    bitcoinValue: action.payload,
                };
            case 'SET_FIAT_VALUE':
                return {
                    ...state,
                    fiatValue: action.payload,
                };
            default:
                return state;
        }
    };

    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        // Update the request amount if it is passed in as a parameter
        // from the RequestAmount screen
        if (route.params?.amount) {
            dispatch({
                type: 'SET_BITCOIN_VALUE',
                payload: new BigNumber(route.params.sats),
            });
            dispatch({
                type: 'SET_FIAT_VALUE',
                payload: new BigNumber(route.params.fiat),
            });
        }
    }, [route.params]);

    const displayLNInvoice = async () => {
        const mSats =
            (state.bitcoinValue > 0 ? state.bitcoinValue : route.params.sats) *
            1_000;

        const satsAmt = mSats / 1_000;

        // Description
        const ln_desc = route.params.lnDescription
            ? route.params.lnDescription
            : `Volt LN invoice for ${addCommas(satsAmt.toString())} sats`;

        try {
            const receivePaymentResp = await receivePayment({
                amountMsat: mSats,
                description: ln_desc,
            });

            setLNInvoice(receivePaymentResp.lnInvoice);

            setLoadingInvoice(false);
        } catch (error) {
            console.log('Error getting node info', error);
        }
    };

    useEffect(() => {
        // Get invoice details
        // Note: hide amount details
        if (walletData.type === 'unified') {
            displayLNInvoice();
        }
    }, []);

    // Format as Bitcoin URI
    const getFormattedAddress = (address: string) => {
        let amount = state.bitcoinValue;

        if (amount.gt(0)) {
            // If amount is greater than 0, return a bitcoin payment request URI
            return `bitcoin:${address}?amount=${amount.div(SATS_TO_BTC_RATE)}`;
        }

        // If amount is 0, return a plain address
        // return a formatted bitcoin address to include the bitcoin payment request URI
        return `bitcoin:${address}`;
    };

    // Set the plain address and bitcoin invoice URI
    const [plainAddress, setPlainAddress] = useState('');
    const BTCInvoice = useMemo(
        () => getFormattedAddress(walletData.address.address),
        [state.bitcoinValue],
    );

    // Copy data to clipboard
    const copyDescToClipboard = (invoice: string) => {
        // Copy backup material to Clipboard
        // Temporarily set copied message
        // and revert after a few seconds
        Clipboard.setString(invoice);

        setPlainAddress(capitalizeFirst(t('copied_to_clipboard')));

        setTimeout(() => {
            setPlainAddress('');
        }, 450);
    };

    const isAmountInvoice =
        (!isLNWallet && !state.bitcoinValue.isZero()) || isLNWallet;

    const carouselRef = useRef<ICarouselInstance>(null);

    const onchainPanel = useCallback((): ReactElement => {
        const copyToClip = () => {
            copyDescToClipboard(BTCInvoice);
        };

        return (
            <View
                style={[tailwind('items-center justify-center h-full w-full')]}>
                {!loadingInvoice && isAmountInvoice && (
                    <View
                        style={[
                            tailwind('mb-4 flex justify-center items-center'),
                        ]}>
                        {/* Make it approx if it doesn't match bottom unit value for requested amount */}
                        {state.bitcoinValue < 100_000_000 ? (
                            <DisplaySatsAmount
                                amount={state.bitcoinValue}
                                fontSize={'text-2xl'}
                            />
                        ) : (
                            <DisplayBTCAmount
                                amount={state.bitcoinValue}
                                fontSize="text-2xl"
                            />
                        )}
                        <View style={[tailwind('opacity-40')]}>
                            {/* Make it approx if it doesn't match bottom unit value for requested amount */}
                            <DisplayFiatAmount
                                amount={formatFiat(state.fiatValue)}
                                fontSize={'text-base'}
                                isApprox={
                                    route.params.amount !==
                                    state.fiatValue.toString()
                                }
                            />
                        </View>
                    </View>
                )}

                <View
                    style={[
                        styles.qrCodeContainer,
                        tailwind('rounded'),
                        {borderColor: ColorScheme.Background.QRBorder},
                    ]}>
                    <QRCodeStyled
                        style={{
                            backgroundColor: 'white',
                        }}
                        data={BTCInvoice}
                        padding={8}
                        pieceSize={8}
                        color={ColorScheme.Background.Default}
                        isPiecesGlued={true}
                        pieceBorderRadius={4}
                    />
                </View>

                {/* Bitcoin address info */}
                {!loadingInvoice && (
                    <View
                        style={[
                            tailwind('p-4 mt-4 w-4/5 rounded'),
                            {backgroundColor: ColorScheme.Background.Greyed},
                        ]}>
                        <PlainButton
                            style={[tailwind('w-full')]}
                            onPress={copyToClip}>
                            <Text
                                ellipsizeMode="middle"
                                numberOfLines={1}
                                style={[{color: ColorScheme.Text.Default}]}>
                                {BTCInvoice}
                            </Text>
                        </PlainButton>
                    </View>
                )}

                {plainAddress.length > 0 && (
                    <View>
                        <Text
                            style={[
                                tailwind('mt-4'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {plainAddress}
                        </Text>
                    </View>
                )}

                {/* Bottom buttons */}
                {!loadingInvoice && (
                    <View style={[tailwind('items-center mt-6')]}>
                        {/* Share Button */}
                        <PlainButton
                            style={[tailwind('mb-6')]}
                            onPress={() => {
                                Share.share({
                                    message: BTCInvoice,
                                    title: 'Share Address',
                                    url: BTCInvoice,
                                });
                            }}>
                            <View
                                style={[
                                    tailwind(
                                        'rounded-full items-center flex-row justify-center px-6 py-3',
                                    ),
                                    {
                                        backgroundColor:
                                            ColorScheme.Background.Inverted,
                                    },
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-sm mr-2 font-bold'),
                                        {
                                            color: ColorScheme.Text.Alt,
                                        },
                                    ]}>
                                    {capitalizeFirst(t('share'))}
                                </Text>
                                <ShareIcon fill={ColorScheme.SVG.Inverted} />
                            </View>
                        </PlainButton>

                        {/* Enter receive amount */}
                        <PlainButton
                            style={[tailwind('mb-4')]}
                            onPress={() => {
                                navigation.dispatch(
                                    CommonActions.navigate({
                                        name: 'RequestAmount',
                                    }),
                                );
                            }}>
                            <Text
                                style={[
                                    tailwind('font-bold text-center'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {t('edit_amount')}
                            </Text>
                        </PlainButton>
                    </View>
                )}
            </View>
        );
    }, [
        ColorScheme,
        BTCInvoice,
        loadingInvoice,
        plainAddress,
        state,
        t,
        tailwind,
        route.params.amount,
        isAmountInvoice,
        styles,
    ]);

    const lnPanel = useCallback((): ReactElement => {
        const copyToClip = () => {
            copyDescToClipboard(LNInvoice?.bolt11 as string);
        };

        return (
            <View
                style={[tailwind('items-center justify-center h-full w-full')]}>
                <Text
                    style={[
                        tailwind('text-base mb-4 font-bold'),
                        {color: ColorScheme.Text.Default},
                    ]}>
                    {capitalizeFirst(t('lightning'))}
                </Text>
                <View
                    style={[
                        styles.qrCodeContainer,
                        tailwind('rounded'),
                        {
                            borderColor: ColorScheme.Background.QRBorder,
                        },
                    ]}>
                    <QRCodeStyled
                        style={{
                            backgroundColor: 'white',
                        }}
                        data={LNInvoice?.bolt11}
                        padding={4}
                        pieceSize={4}
                        color={ColorScheme.Background.Default}
                        isPiecesGlued={true}
                        pieceBorderRadius={2}
                    />
                </View>

                {/* Bitcoin address info */}
                {!loadingInvoice && (
                    <View
                        style={[
                            tailwind('p-4 mt-4 w-4/5 rounded'),
                            {backgroundColor: ColorScheme.Background.Greyed},
                        ]}>
                        <PlainButton
                            style={[tailwind('w-full')]}
                            onPress={copyToClip}>
                            <Text
                                ellipsizeMode="middle"
                                numberOfLines={1}
                                style={[{color: ColorScheme.Text.Default}]}>
                                {LNInvoice?.bolt11}
                            </Text>
                        </PlainButton>
                    </View>
                )}

                {plainAddress.length > 0 && (
                    <View>
                        <Text
                            style={[
                                tailwind('mt-4'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {plainAddress}
                        </Text>
                    </View>
                )}

                {/* Bottom buttons */}
                {!loadingInvoice && (
                    <View style={[tailwind('items-center mt-6')]}>
                        {/* Share Button */}
                        <PlainButton
                            style={[tailwind('mb-6')]}
                            onPress={() => {
                                Share.share({
                                    message: LNInvoice?.bolt11 as string,
                                    title: 'Share Address',
                                    url: LNInvoice?.bolt11 as string,
                                });
                            }}>
                            <View
                                style={[
                                    tailwind(
                                        'rounded-full items-center flex-row justify-center px-6 py-3',
                                    ),
                                    {
                                        backgroundColor:
                                            ColorScheme.Background.Inverted,
                                    },
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-sm mr-2 font-bold'),
                                        {
                                            color: ColorScheme.Text.Alt,
                                        },
                                    ]}>
                                    {capitalizeFirst(t('share'))}
                                </Text>
                                <ShareIcon fill={ColorScheme.SVG.Inverted} />
                            </View>
                        </PlainButton>

                        {/* Enter receive amount */}
                        <PlainButton
                            style={[tailwind('mb-4')]}
                            onPress={() => {
                                navigation.dispatch(
                                    CommonActions.navigate({
                                        name: 'RequestAmount',
                                    }),
                                );
                            }}>
                            <Text
                                style={[
                                    tailwind('font-bold text-center'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {t('edit_amount')}
                            </Text>
                        </PlainButton>
                    </View>
                )}
            </View>
        );
    }, [
        ColorScheme,
        tailwind,
        LNInvoice,
        loadingInvoice,
        plainAddress,
        t,
        styles,
    ]);

    const panels = useMemo(
        (): Slide[] => [lnPanel, onchainPanel],
        [onchainPanel, lnPanel],
    );

    return (
        <SafeAreaView
            edges={['bottom', 'right', 'left']}
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View
                style={[
                    tailwind('w-full h-full items-center justify-center'),
                    {backgroundColor: ColorScheme.Background.Default},
                ]}>
                <View
                    style={[
                        tailwind(
                            'w-5/6 justify-center items-center absolute top-6 flex',
                        ),
                    ]}>
                    <PlainButton
                        style={[tailwind('absolute left-0 z-10')]}
                        onPress={() => {
                            navigation.dispatch(StackActions.popToTop());
                        }}>
                        <Close fill={ColorScheme.SVG.Default} />
                    </PlainButton>

                    <Text
                        style={[
                            tailwind('text-lg font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {t('bitcoin_invoice')}
                    </Text>

                    {/* Invoice Timeout */}
                    {LNInvoice?.expiry && (
                        <View style={[tailwind('absolute right-0')]}>
                            <ExpiryTimer expiryDate={LNInvoice?.expiry} />
                        </View>
                    )}
                </View>

                {/* Invoice Panel */}
                {loadingInvoice && (
                    <View
                        style={[
                            tailwind(
                                'items-center w-full h-full justify-center',
                            ),
                            // To avoid lagging due to Carousel load from conditional rendering
                            // we fake a loading screen
                            {
                                zIndex: 999,
                                backgroundColor: ColorScheme.Background.Primary,
                            },
                        ]}>
                        <ActivityIndicator />
                        <Text
                            style={[
                                tailwind('text-sm mt-4'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {isAdvancedMode
                                ? t('loading_invoice_advanced', {
                                      spec: 'Bolt11',
                                  })
                                : t('loading_invoice')}
                        </Text>
                    </View>
                )}

                {isLNWallet && (
                    <View
                        style={[
                            styles.carouselContainer,
                            tailwind('bottom-0 absolute'),
                        ]}>
                        <Carousel
                            ref={carouselRef}
                            style={[tailwind('items-center')]}
                            data={panels}
                            width={NativeDims.width}
                            height={NativeDims.height * 0.8 - 20}
                            loop={false}
                            panGestureHandlerProps={{
                                activeOffsetX: [-10, 10],
                            }}
                            testID="ReceiveSlider"
                            renderItem={({index}): ReactElement => {
                                const Slide = panels[index];
                                return <Slide key={index} />;
                            }}
                            onProgressChange={(_, absoluteProgress): void => {
                                progressValue.value = absoluteProgress;
                            }}
                        />
                    </View>
                )}

                {!isLNWallet && onchainPanel()}
            </View>
        </SafeAreaView>
    );
};

export default Receive;

const styles = StyleSheet.create({
    qrCodeContainer: {
        borderWidth: 2,
    },
    carouselContainer: {
        flex: 1,
    },
});
