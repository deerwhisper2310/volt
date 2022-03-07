/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';

import {useColorScheme, StyleSheet, Text, View} from 'react-native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import tailwind from 'tailwind-rn';

import {PlainButton} from '../../components/button';

import {TextSingleInput} from '../../components/input';
import {LongBottomButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const ImportAction = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const [walletName, setWalletName] = useState('');

    const onBlur = () => {
        const valueWithSingleWhitespace = walletName.replace(
            /^\s+|\s+$|\s+(?=\s)/g,
            '',
        );

        setWalletName(valueWithSingleWhitespace);

        return valueWithSingleWhitespace;
    };

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind('w-full h-full items-center'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View style={[tailwind('w-5/6 mt-4')]}>
                    <PlainButton
                        style={tailwind('items-center flex-row -ml-1')}
                        onPress={() => {
                            navigation.goBack();
                        }}>
                        <Back
                            style={tailwind('mr-2')}
                            fill={ColorScheme.SVG.Default}
                        />
                        <Text
                            style={[
                                tailwind('text-sm font-medium'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            Back
                        </Text>
                    </PlainButton>

                    <Text
                        style={[
                            tailwind('font-bold text-2xl mt-20'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Create New Wallet
                    </Text>

                    <Text
                        style={[
                            tailwind('text-sm mt-2'),
                            {color: ColorScheme.Text.GrayText},
                        ]}>
                        Defaults to SegWit (bech32)
                    </Text>

                    <View
                        style={[
                            tailwind('mt-10 border-gray-400 px-4'),
                            {borderWidth: 1, borderRadius: 6},
                        ]}>
                        <TextSingleInput
                            placeholder={'Enter Wallet name'}
                            onChangeText={setWalletName}
                            onBlur={onBlur}
                            color={ColorScheme.Text.Default}
                        />
                    </View>
                </View>

                <LongBottomButton
                    title={'Continue'}
                    textColor={
                        walletName.trim().length > 0
                            ? ColorScheme.Text.Alt
                            : ColorScheme.Text.GrayedText
                    }
                    backgroundColor={
                        walletName.trim().length > 0
                            ? ColorScheme.Background.Inverted
                            : ColorScheme.Background.Secondary
                    }
                />
            </View>
        </SafeAreaView>
    );
};

export default ImportAction;

const styles = StyleSheet.create({});