import {StyleSheet, Text, View, useColorScheme} from 'react-native';
import React from 'react';

import {useNavigation} from '@react-navigation/native';

import tailwind from 'tailwind-rn';

import {PlainButton, PaddedButton} from './button';

import Font from '../constants/Font';
import Color from '../constants/Color';

export const EmptyCard = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const altGray = {
        backgroundColor: ColorScheme.isDarkMode ? '#2C2C2C' : '#ededed',
    };

    return (
        <View style={tailwind('w-full h-48 relative items-center')}>
            <View
                style={[
                    tailwind(
                        'w-11/12 h-full absolute -bottom-2 rounded-md z-20 opacity-60',
                    ),
                    styles.DarkGrayCard,
                ]}
            />

            <View
                style={[tailwind('w-full h-48 p-6 rounded-md z-30'), altGray]}>
                <Text
                    style={[
                        tailwind('text-lg w-full text-left mb-4 font-medium'),
                        {color: ColorScheme.Text.Default},
                        Font.RobotoText,
                    ]}>
                    Add new wallet
                </Text>
                <Text
                    style={[
                        tailwind('text-xs w-full text-left mb-4'),
                        {color: ColorScheme.Text.DescText},
                        Font.RobotoText,
                    ]}>
                    Click ‘add’ button below or ‘+’ icon above to create a new
                    wallet
                </Text>

                <PaddedButton
                    onPress={() => {
                        navigation.navigate('WalletRoot');
                    }}
                    title={'Add'}
                    color={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                />
            </View>
        </View>
    );
};

export const BaseCard = props => {
    const ColorScheme = Color(useColorScheme());

    const altGray = {
        backgroundColor: ColorScheme.isDarkMode ? '#2C2C2C' : '#ededed',
    };

    return (
        <View style={tailwind('w-full h-48 relative items-center')}>
            <View
                style={[
                    tailwind(
                        'w-11/12 h-full absolute -bottom-2 rounded-md z-20 opacity-60',
                    ),
                    styles.DarkGrayCard,
                ]}
            />

            {props.isWatchOnly ? (
                <View style={[tailwind('absolute top-7 right-6 z-40')]}>
                    <Text
                        style={[
                            tailwind('text-xs font-medium'),
                            {color: ColorScheme.Text.GrayText},
                            Font.RobotoText,
                        ]}>
                        Watch-only
                    </Text>
                </View>
            ) : (
                <></>
            )}

            <View
                style={[tailwind('w-full h-48 p-6 rounded-md z-30'), altGray]}>
                <Text
                    style={[
                        tailwind('text-xl w-full text-left font-medium mb-1'),
                        {color: ColorScheme.Text.Default},
                        Font.RobotoText,
                    ]}>
                    {props.label}
                </Text>
                <Text
                    style={[
                        tailwind('text-sm w-full text-left'),
                        {color: ColorScheme.Text.DescText},
                        Font.RobotoText,
                    ]}>
                    {props.walletType}
                </Text>

                <PlainButton
                    style={[tailwind('absolute bottom-8 left-6')]}
                    onPress={() => {
                        /* Toggle between sats/BTC/currency */
                    }}>
                    <View style={[tailwind('flex-row items-center')]}>
                        <Text
                            style={[
                                tailwind('text-4xl mr-2 pt-2'),
                                {color: ColorScheme.Text.Default},
                                Font.SatSymbol,
                            ]}>
                            S
                        </Text>

                        <Text
                            style={[
                                tailwind('text-4xl pt-1 self-center'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            {props.walletBalance}
                        </Text>
                    </View>
                </PlainButton>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    DarkGrayCard: {
        backgroundColor: '#B5B5B5',
    },
});
