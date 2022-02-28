/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';

import {
    useColorScheme,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
} from 'react-native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import tailwind from 'tailwind-rn';

import {TextMultiInput} from '../../components/input';

import Back from './../../assets/svg/arrow-left-24.svg';
import Folder from './../../assets/svg/file-directory-fill-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const ImportAction = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const [importText, setImportText] = useState('');

    const onBlur = () => {
        const valueWithSingleWhitespace = importText.replace(
            /^\s+|\s+$|\s+(?=\s)/g,
            '',
        );

        setImportText(valueWithSingleWhitespace);

        return valueWithSingleWhitespace;
    };

    const importInstructions =
        'Enter one of the following:\n\n- 12-24 word seed\n- Xpub/Zpub (watch-only)\n- Xpriv/Zpriv\n- PrivateKey (WIF)\n- Bitcoin Core Wallet file (.dat)\n- Samourai Wallet backup';

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind('w-full h-full items-center'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View style={[tailwind('w-5/6 mt-4')]}>
                    <TouchableOpacity
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
                                tailwind('text-sm'),
                                {color: ColorScheme.Text.Default},
                                Font.BoldText,
                            ]}>
                            Back
                        </Text>
                    </TouchableOpacity>

                    <Text style={[tailwind('font-bold text-2xl mt-20')]}>
                        Import Wallet
                    </Text>
                    <Text
                        style={[
                            tailwind('text-sm mt-2'),
                            {color: ColorScheme.Text.GrayText},
                        ]}>
                        Enter backup material
                    </Text>

                    <View
                        style={[
                            tailwind('mt-10 border-gray-400 px-4'),
                            {borderWidth: 1, borderRadius: 6},
                        ]}>
                        <TextMultiInput
                            placeholder={importInstructions}
                            onChangeText={setImportText}
                            onBlur={onBlur}
                        />

                        <View style={[tailwind('absolute right-4 bottom-4')]}>
                            <TouchableOpacity>
                                <Folder
                                    width={22}
                                    fill={ColorScheme.SVG.Default}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity disabled={importText.trim().length === 0}>
                        <View
                            style={[
                                tailwind('mt-8 rounded items-center'),
                                {
                                    backgroundColor:
                                        importText.trim().length > 0
                                            ? ColorScheme.Background.Inverted
                                            : ColorScheme.Background.Secondary,
                                },
                            ]}>
                            <Text
                                style={[
                                    tailwind('px-4 py-4 font-bold'),
                                    {
                                        color:
                                            importText.trim().length > 0
                                                ? ColorScheme.Text.Alt
                                                : ColorScheme.Text.GrayedText,
                                    },
                                ]}>
                                Continue
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default ImportAction;

const styles = StyleSheet.create({});