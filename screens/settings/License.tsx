import React from 'react';
import {
    Text,
    View,
    FlatList,
    useColorScheme,
    TouchableOpacity,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation} from '@react-navigation/core';

import {useTailwind} from 'tailwind-rn';

import {useTranslation} from 'react-i18next';
import {capitalizeFirst} from '../../modules/transform';

import Back from './../../assets/svg/arrow-left-24.svg';

import Font from './../../constants/Font';
import Color from '../../constants/Color';

import LICENSE from './../../data/LICENSE.json';

const License = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {t} = useTranslation('settings');

    const renderItem = ({item}: {item: string | string[]}) => {
        return (
            <View style={tailwind('mb-4')}>
                <Text
                    style={[
                        tailwind('text-xs'),
                        {color: ColorScheme.Text.Default},
                        Font.RobotoText,
                    ]}>
                    {item}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView edges={['left', 'bottom', 'right']}>
            <View style={[tailwind('w-full h-full items-center')]}>
                <View
                    style={[
                        tailwind(
                            'w-5/6 my-8 items-center justify-center flex-row',
                        ),
                        {backgroundColor: ColorScheme.Background.Primary},
                    ]}>
                    <TouchableOpacity
                        style={tailwind('absolute w-full left-0')}
                        onPress={() => {
                            navigation.goBack();
                        }}>
                        <Back fill={ColorScheme.SVG.Default} />
                    </TouchableOpacity>
                    <Text
                        style={[
                            tailwind('text-sm font-medium'),
                            {color: ColorScheme.Text.Default},
                            Font.RobotoText,
                        ]}>
                        {capitalizeFirst(t('license'))}
                    </Text>
                </View>

                <View
                    style={[
                        tailwind('self-center w-full h-full items-center'),
                    ]}>
                    <FlatList
                        style={tailwind('w-5/6 pt-8')}
                        data={LICENSE}
                        renderItem={renderItem}
                        keyExtractor={(_item, index) => `${index}`}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

export default License;
