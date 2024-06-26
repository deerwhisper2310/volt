import {Platform} from 'react-native';

import {initialWindowMetrics} from 'react-native-safe-area-context';

const Insets = initialWindowMetrics
    ? initialWindowMetrics.insets
    : {top: 0, left: 0, right: 0, bottom: 0};
const Frame = initialWindowMetrics
    ? initialWindowMetrics.frame
    : {x: 0, y: 0, width: 0, height: 0};

/* General Insets

    IOS -> 34
    Android -> ~15.14

*/

const BottomOffset =
    Platform.OS === 'ios'
        ? Insets.bottom - 18 // IOS -> 16
        : Insets.bottom > 16 //
        ? Insets.bottom - 22 // Android with default 3 buttons; Android -> -6.86
        : Insets.bottom + 26; // Android with IOS-like bottom; Android -> 41.14

export default {
    width: Frame.width,
    height: Frame.height,
    left: Insets.left,
    right: Insets.right,
    bottom: BottomOffset,
    bottomButtonOffset: BottomOffset + 32,
    navBottom:
        Platform.OS === 'ios'
            ? BottomOffset * 3 // 48
            : BottomOffset * 1.25, // -8.575 or 51.425
} as const;
