import React, {useContext, useMemo} from 'react';
import {
    Text,
    View,
    useColorScheme,
    Alert,
    Platform,
    Keyboard,
    StyleSheet,
} from 'react-native';

import {AppStorageContext} from '../class/storageContext';

import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {BottomModal} from './bmodal';
import Color from '../constants/Color';

import {LongButton, PlainButton} from './button';
import {conservativeAlert} from './alert';
import Prompt from 'react-native-prompt-android';

import {useTailwind} from 'tailwind-rn';

import {TMempoolFeeRates} from '../types/wallet';

type FeeProps = {
    feeRef: React.RefObject<BottomSheetModal>;
    feeRates: TMempoolFeeRates;
    setFeeRate: (feeRate: number) => void;
    onUpdate: (idx: number) => void;
};

const FeeModal = (props: FeeProps) => {
    const tailwind = useTailwind();
    const snapPoints = useMemo(() => ['50%'], []);

    const ColorScheme = Color(useColorScheme());

    const isAndroid = Platform.OS === 'android';

    const {isAdvancedMode} = useContext(AppStorageContext);

    const processRate = (value: string | undefined) => {
        const rate = Number(value);

        // Warn user that fee rate invalid
        if (Number.isNaN(rate)) {
            conservativeAlert(
                'Invalid fee rate',
                'Please enter a valid fee rate',
            );

            return;
        }

        props.setFeeRate(rate);

        Keyboard.dismiss();
    };

    const openFeeModal = () => {
        if (isAndroid) {
            Prompt(
                'Custom',
                'Enter fee rate (sats/vB)',
                [
                    {text: 'Cancel'},
                    {
                        text: 'Set',
                        onPress: processRate,
                    },
                ],
                {
                    type: 'numeric',
                },
            );
        } else {
            Alert.prompt(
                'Custom',
                'Enter fee rate (sats/vB)',
                [
                    {
                        text: 'Cancel',
                        onPress: () => {},
                        style: 'cancel',
                    },
                    {
                        text: 'Set',
                        onPress: processRate,
                    },
                ],
                'plain-text',
                '',
                'number-pad',
            );
        }
    };

    return (
        <BottomModal
            snapPoints={snapPoints}
            ref={props.feeRef}
            onUpdate={props.onUpdate}
            backgroundColor={ColorScheme.Background.Primary}
            handleIndicatorColor={'#64676E'}
            backdrop={true}>
            <View
                style={[
                    tailwind('w-full h-full items-center relative'),
                    {
                        backgroundColor: ColorScheme.Background.Primary,
                    },
                ]}>
                <View
                    style={[
                        tailwind('w-full flex-row items-center justify-center'),
                    ]}>
                    <Text
                        style={[
                            tailwind('text-sm font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Select Fee Rate
                    </Text>
                </View>

                <View style={[tailwind('w-full px-6 py-8 rounded mt-2')]}>
                    {/* Fee selection: 10 mins */}
                    <PlainButton
                        onPress={() => {
                            props.setFeeRate(props.feeRates.fastestFee);
                        }}>
                        <View style={[tailwind('items-center')]}>
                            <View
                                style={[
                                    tailwind(
                                        'flex-row justify-between items-center w-full',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind(
                                            'text-left text-sm font-semibold',
                                        ),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    High Priority
                                </Text>

                                <View
                                    style={[tailwind('items-center flex-row')]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm mr-2'),
                                            {
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                            },
                                        ]}>
                                        {isAdvancedMode
                                            ? `${props.feeRates.fastestFee} sat/vB`
                                            : '~10 mins'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </PlainButton>

                    <View
                        style={[
                            styles.divider,
                            tailwind('w-full mt-4'),
                            {
                                backgroundColor: ColorScheme.Background.Greyed,
                            },
                        ]}
                    />

                    {/* Fee selection: Medium 30 minutes */}
                    <PlainButton
                        onPress={() => {
                            props.setFeeRate(props.feeRates.halfHourFee);
                        }}>
                        <View style={[tailwind('items-center mt-4')]}>
                            <View
                                style={[
                                    tailwind(
                                        'flex-row justify-between items-center w-full',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind(
                                            'text-left text-sm font-semibold',
                                        ),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    Slow
                                </Text>

                                <View
                                    style={[tailwind('items-center flex-row')]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm mr-2'),
                                            {
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                            },
                                        ]}>
                                        {isAdvancedMode
                                            ? `${props.feeRates.economyFee} sat/vB`
                                            : '~30 mins'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </PlainButton>

                    <View
                        style={[
                            styles.divider,
                            tailwind('w-full mt-4'),
                            {
                                backgroundColor: ColorScheme.Background.Greyed,
                            },
                        ]}
                    />

                    {/* Fee selection: Slow 1 hour */}
                    <PlainButton
                        onPress={() => {
                            props.setFeeRate(props.feeRates.minimumFee);
                        }}>
                        <View style={[tailwind('items-center mt-4')]}>
                            <View
                                style={[
                                    tailwind(
                                        'flex-row justify-between items-center w-full',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind(
                                            'text-left text-sm font-semibold',
                                        ),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    Economic
                                </Text>

                                <View
                                    style={[tailwind('items-center flex-row')]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm mr-2'),
                                            {
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                            },
                                        ]}>
                                        {isAdvancedMode
                                            ? `${props.feeRates.minimumFee} sat/vB`
                                            : 'more than 1 hour'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </PlainButton>
                </View>

                {/* Fee selection: Custom */}
                <View style={[tailwind('w-4/5 absolute bottom-6')]}>
                    <LongButton
                        title={'Custom'}
                        onPress={openFeeModal}
                        backgroundColor={ColorScheme.Background.Inverted}
                        textColor={ColorScheme.Text.Alt}
                    />
                </View>
            </View>
        </BottomModal>
    );
};

export default FeeModal;

const styles = StyleSheet.create({
    divider: {
        height: 1,
    },
});