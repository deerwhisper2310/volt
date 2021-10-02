import React, {useState} from 'react';

import {
    StyleSheet,
    Text,
    View,
    FlatList,
    useColorScheme,
    TouchableOpacity,
} from 'react-native';

import languages from '../../loc/languages';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import tailwind from 'tailwind-rn';

import Back from './../../assets/svg/arrow-left-24.svg';
import Check from './../../assets/svg/check-circle-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const Language = () => {
    const navigation = useNavigation();

    const [selectedLang, setLang] = useState('en');

    const ColorScheme = Color(useColorScheme());

    const HeadingBar = {
        height: 2,
        backgroundColor: ColorScheme.HeadingBar,
    };

    const renderItem = ({item, index}) => {
        return (
            <TouchableOpacity
                onPress={() => {
                    setLang(item.code);
                }}>
                <View
                    style={[
                        tailwind(
                            'w-5/6 self-center items-center flex-row justify-between mt-3 mb-6',
                        ),
                        index === 0 ? styles.PaddedTop : {},
                    ]}>
                    <Text
                        style={[
                            tailwind('text-sm'),
                            Font.RegularText,
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {item.name}
                    </Text>

                    <View
                        style={[
                            tailwind('flex-row items-center justify-between'),
                        ]}>
                        {selectedLang === item.code && (
                            <Check width={16} fill={ColorScheme.SVG.Default} />
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{backgroundColor: ColorScheme.Background.Primary}}>
            <View style={[tailwind('w-full h-full items-center')]}>
                <View
                    style={[
                        tailwind('w-full h-full mt-4 items-center'),
                        styles.Flexed,
                    ]}>
                    <View style={tailwind('w-5/6 mb-16')}>
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
                                    Font.BoldText,
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                Settings
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View
                        style={tailwind('justify-center w-full items-center')}>
                        <Text
                            style={[
                                tailwind('text-2xl mb-4 w-5/6'),
                                Font.MediumText,
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Language
                        </Text>

                        <View style={[tailwind('w-full'), HeadingBar]} />
                    </View>

                    <FlatList
                        style={[tailwind('w-full'), styles.Flexed]}
                        data={languages}
                        renderItem={renderItem}
                        keyExtractor={item => item.code}
                        initialNumToRender={25}
                        contentInsetAdjustmentBehavior="automatic"
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Language;

const styles = StyleSheet.create({
    PaddedTop: {
        paddingTop: 16,
    },
    Flexed: {
        flex: 1,
    },
});