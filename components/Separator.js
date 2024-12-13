import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../configs/Colors";

const Separator = () => {
    return (
        <View style={styles.separator} />
    )
}

const styles = StyleSheet.create({
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
    },
})

export default Separator;
