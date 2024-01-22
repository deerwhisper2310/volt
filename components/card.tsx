/* eslint-disable react-native/no-inline-styles */
import React, {useContext} from 'react';
import {StyleSheet, Text, View, useColorScheme} from 'react-native';

import {useNavigation, CommonActions} from '@react-navigation/native';

import {AppStorageContext} from '../class/storageContext';

import {useTailwind} from 'tailwind-rn';

import {PlainButton} from './button';

import {Balance} from './balance';

import {WalletCardProps} from '../types/props';

import Font from '../constants/Font';
import Color from '../constants/Color';

import BITCOIN from '../assets/svg/btc.svg';
import SIM from '../assets/svg/sim.svg';

export const EmptyCard = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const altGray = {
        backgroundColor: ColorScheme.isDarkMode ? '#2C2C2C' : '#ededed',
    };

    return (
        <View style={tailwind('w-full h-48 relative items-center')}>
            <View
                style={[
                    styles.darkGrayCard,
                    tailwind(
                        'w-11/12 h-full absolute -bottom-2 rounded-md z-20 opacity-60',
                    ),
                ]}
            />

            <View
                style={[tailwind('w-full h-48 p-6 rounded-md z-30'), altGray]}>
                <Text
                    style={[
                        tailwind('text-lg w-full text-left mb-1 font-medium'),
                        {color: ColorScheme.Text.Default},
                        Font.RobotoText,
                    ]}>
                    New Wallet
                </Text>
                <Text
                    style={[
                        tailwind('text-xs w-full text-left'),
                        {color: ColorScheme.Text.DescText},
                        Font.RobotoText,
                    ]}>
                    Create or restore a new wallet
                </Text>

                <PlainButton
                    style={[
                        tailwind(
                            'absolute bottom-6 left-6 px-8 py-2 rounded-full',
                        ),
                        {
                            backgroundColor: ColorScheme.Background.Inverted,
                        },
                    ]}
                    onPress={() => {
                        navigation.dispatch(
                            CommonActions.navigate({name: 'AddWalletRoot'}),
                        );
                    }}>
                    <Text
                        style={[
                            tailwind('text-xs font-bold'),
                            {color: ColorScheme.Text.Alt},
                            Font.RobotoText,
                        ]}>
                        Add
                    </Text>
                </PlainButton>
            </View>
        </View>
    );
};

export const WalletCard = (props: WalletCardProps) => {
    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {appLanguage} = useContext(AppStorageContext);

    const langDir = appLanguage.dir === 'RTL' ? 'right' : 'left';

    const mxPositionBTC =
        langDir === 'right'
            ? {left: props.hideBalance ? -34 : -24}
            : {right: props.hideBalance ? -34 : -24};

    const mxPositionSim = langDir === 'right' ? {right: 24} : {left: 24};

    return (
        <PlainButton
            onPress={() => {
                if (props.navCallback) {
                    props.navCallback();
                }
            }}
            activeOpacity={1}>
            <View
                style={[
                    tailwind('w-full relative items-center'),
                    {height: 206},
                ]}>
                <View
                    style={[
                        styles.overflowHidden,
                        tailwind('w-full rounded-md z-50 px-6'),
                        {
                            height: 206,
                            backgroundColor:
                                ColorScheme.WalletColors[props.walletType][
                                    props.network
                                ],
                        },
                    ]}>
                    <View
                        style={[
                            tailwind(
                                'absolute right-0 z-50 h-full rounded-br opacity-60',
                            ),
                            {width: 6},
                        ]}>
                        <View
                            style={[
                                tailwind(
                                    'h-4/6 rounded-tr rounded-bl rounded-br-none absolute right-0',
                                ),
                                {width: 10},
                            ]}
                        />
                    </View>

                    <View
                        style={[
                            tailwind('absolute h-auto w-auto opacity-40 z-0'),
                            {
                                top: props.hideBalance ? -34 : -16,
                                ...mxPositionBTC,
                            },
                        ]}>
                        <BITCOIN fill={'black'} width={148} height={148} />
                    </View>

                    {!props.isWatchOnly ? (
                        <View
                            style={[
                                {
                                    top: 18,
                                    ...mxPositionSim,
                                },
                                tailwind('absolute opacity-80 h-auto w-auto'),
                            ]}>
                            <SIM fill={'white'} width={42} height={42} />
                        </View>
                    ) : (
                        <></>
                    )}

                    <Text
                        numberOfLines={1}
                        ellipsizeMode="middle"
                        style={[
                            styles.label,
                            tailwind(
                                'absolute pt-4 mt-1 text-base w-full text-left text-white opacity-60',
                            ),
                            {
                                bottom: props.hideBalance ? 72 : 54,
                                textAlign: langDir,
                            },
                            Font.RobotoText,
                        ]}>
                        {props.label}
                    </Text>

                    {props.isWatchOnly ? (
                        <View
                            style={[
                                langDir === 'right'
                                    ? styles.watchOnlyRTL
                                    : styles.watchOnlyLTR,
                                tailwind(
                                    'bg-black absolute rounded-full opacity-60',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind(
                                        'text-xs text-white font-bold px-4 py-1',
                                    ),
                                    Font.RobotoText,
                                ]}>
                                Watch only
                            </Text>
                        </View>
                    ) : (
                        <></>
                    )}

                    {/* Show Balance or Maxed card */}
                    {!props.maxedCard || props.hideBalance ? (
                        <View style={tailwind('w-full absolute mx-6 bottom-5')}>
                            <Balance
                                fontColor={'white'}
                                balance={props.balance}
                                balanceFontSize={'text-2xl'}
                                disableFiat={true}
                                loading={props.loading}
                            />
                        </View>
                    ) : (
                        <View
                            style={[
                                styles.maxedOut,
                                tailwind(
                                    'bg-black absolute rounded opacity-60',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind(
                                        'text-xs text-white font-bold px-4 py-1',
                                    ),
                                    {textAlign: langDir},
                                    Font.RobotoText,
                                ]}>
                                Swept Balance
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </PlainButton>
    );
};

const styles = StyleSheet.create({
    darkGrayCard: {
        backgroundColor: '#B5B5B5',
    },
    overflowHidden: {
        overflow: 'hidden',
    },
    label: {
        left: 24,
        fontWeight: '100',
    },
    watchOnlyLTR: {
        top: 24,
        left: 20,
    },
    watchOnlyRTL: {
        top: 24,
        right: 20,
    },
    maxedOut: {
        bottom: 20,
        left: 24,
    },
});
