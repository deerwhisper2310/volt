import React from 'react';

import {
    StyleSheet,
    FlatList,
    Text,
    useColorScheme,
    View,
    Linking,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import tailwind from 'tailwind-rn';

import CoinprofileLogo from './../assets/svg/coinprofile.svg';
import BitrefillLogo from './../assets/svg/bitrefill.svg';
import ChangellyLogo from './../assets/svg/changelly.svg';
import {TouchableOpacity} from 'react-native-gesture-handler';

const Apps = () => {
    const isDarkMode = useColorScheme() === 'dark';

    const DarkText = {
        color: isDarkMode ? 'white' : 'black',
    };

    // Apps
    const Services = [
        {
            key: '1',
            title: 'Coinprofile',
            desc: 'Send Bitcoin to NGN Bank Accounts',
            icon: CoinprofileLogo,
            mainBG: {
                backgroundColor: '#00B3E4',
            },
            textHue: {
                color: '#095569',
            },
            url: 'https://coinprofile.co',
        },
        {
            key: '2',
            title: 'Bitrefill',
            desc: 'Buy Giftcards with your Bitcoin',
            icon: BitrefillLogo,
            mainBG: {
                backgroundColor: '#2E70B7',
            },
            textHue: {
                color: '#A3C4E8',
            },
            url: 'https://bitrefill.com',
        },
        {
            key: '3',
            title: 'Changelly',
            desc: 'Swap Bitcoin for other Crypto',
            icon: ChangellyLogo,
            mainBG: {
                backgroundColor: '#2D3A34',
            },
            textHue: {
                color: '#1E9A61',
            },
            url: 'https://changelly.com',
        },
    ];

    const renderItem = ({item}) => {
        return (
            /* We'll eventually use WebView to have all the interaction in-App
            It would be even better if the services had APIs we could just wrap a UI over to make a lot more smooth UX-wise */

            <TouchableOpacity onPress={() => {Linking.openURL(item.url)}}>
                <View
                    key={item.key}
                    style={[
                        tailwind(
                            'bg-blue-600 w-full h-28 rounded-md items-center justify-center flex-row p-6 mb-4',
                        ),
                        item.mainBG,
                    ]}>
                    <View style={[tailwind('flex h-5/6 w-5/6 justify-around')]}>
                        <Text
                            style={[
                                styles.BoldText,
                                tailwind('text-xl text-white'),
                            ]}>
                            {item.title}
                        </Text>
                        <Text
                            style={[
                                styles.MediumText,
                                tailwind('text-xs'),
                                item.textHue,
                            ]}>
                            {item.desc}
                        </Text>
                    </View>
                    <item.icon />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView>
            <View style={[tailwind('h-full items-center')]}>
                {/* Top bar */}
                <View
                    style={[
                        tailwind('w-full h-12 mt-4 justify-center pl-9 mb-6'),
                    ]}>
                    <Text
                        style={[
                            DarkText,
                            tailwind('text-2xl'),
                            styles.MediumText,
                        ]}>
                        Apps
                    </Text>
                </View>

                {/* List of Apps */}
                <FlatList
                    style={tailwind('w-5/6')}
                    data={Services}
                    renderItem={renderItem}
                    keyExtractor={item => item.key}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    RegularText: {
        fontFamily: 'Roboto',
    },
    MediumText: {
        fontFamily: 'Roboto Medium',
    },
    BoldText: {
        fontFamily: 'Roboto Bold',
    },
    SatSymbol: {
        fontFamily: 'Satoshi Symbol',
    },
});

export default Apps;