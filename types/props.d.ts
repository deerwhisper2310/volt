// All reuseable Props and Base Types for RN and App
import React, {PropsWithChildren} from 'react';
import {SvgProps} from 'react-native-svg';

import {BalanceType, Unit, TransactionType} from './wallet';
import BigNumber from 'bignumber.js';

// Base Prop Type
export type BaseProps = PropsWithChildren<{
    style?: React.CSSProperties | StyleProp<ViewStyle>;
    onPress?: () => void;
    disabled?: boolean;
    activeOpacity?: number;
}>;

export type AppCard = BaseProps & {
    key: React.Key;
    title: string;
    description: string;
    icon: React.FC<SvgProps>;
    url: string;
    color: {
        backgroundColor: string;
    };
    textHue: {
        color: string;
    };
};

// Button prop type
export type ButtonProps = BaseProps & {
    backgroundColor: string;
    color?: string;
    textColor?: string;
    title: string;
    props?:
        | React.ComponentPropsWithoutRef<'button'>
        | Readonly<TouchableOpacityProps>;
};

// Base Card Prop Type (for reuse)
export type CardProps = BaseProps & {
    color?: string;
    backgroundColor?: string;
    label: string;
};

export type WalletCardProps = CardProps & {
    id: string;
    walletBalance: BalanceType;
    walletType: string;
    isWatchOnly: boolean;
    hideBalance: boolean;
    loading: boolean;
    unit: Unit;
    network: string;
    navCallback?: () => void;
};

export type TxListItemProps = BaseProps & {
    tx: TransactionType;
    callback?: () => void;
};

export type TxBalanceProps = BaseProps & {
    balance: BalanceType;
    BalanceFontSize?: string;
    fontColor?: string;
};

export type BalanceProps = BaseProps & {
    id: string; // current id of the wallet to show balance
    // Below takes in a valid 'Tailwind' font size (i.e., 'text-2xl')
    BalanceFontSize?: string;
    SatsFontSize?: string;
    loading: boolean;
    disableFiat: boolean; // false by default
};

export type FiatBalanceProps = BaseProps & {
    balance: BalanceType;
    BalanceFontSize?: string;
    loading: boolean;
    fontColor: string;
};

// Base Text Input Prop Type (for reuse)
export type TextInputProps = BaseProps & {
    shavedHeight?: boolean;
    color: string;
    isEnabled?: boolean;
    placeholder: string;
    placeholderTextColor?: string;
    onBlur?: () => void;
    value?: string;
    refs?: React.RefObject<TextInput>;
    onChangeText?:
        | ((text: string) => void)
        | React.Dispatch<React.SetStateAction<string>>;
};

// Text Long Input Prop Type
export type TextLongInputProps = BaseProps &
    TextInputProps & {
        borderColor?: string;
        showFolder?: boolean;
        folderColor?: string;
        showScanIcon?: boolean;
        showTestnetToggle?: boolean;
        onChange?: React.Dispatch<React.SetStateAction>;
        onSuccess: (
            data: any,
        ) => void | boolean | Promise<boolean> | Promise<void>;
        onCancel: (error) => void;
        onError: (error) => void;
        toggleSwitch?:
            | (() => void)
            | React.Dispatch<React.SetStateAction<boolean>>;
    };

// Numpad Input Prop Type
export type NumpadRequestInputProps = BaseProps & {
    amount: string;
    isSats?: boolean;
    onAmountChange: (amount: string) => void;
};

export type DisplaySatsAmountProps = BaseProps & {
    amount: BigNumber;
    isApprox?: boolean;
    fontSize: string;
};

export type DisplayFiatAmountProps = BaseProps & {
    amount: string;
    isApprox?: boolean;
    fontSize: string;
    symbol: string;
};
