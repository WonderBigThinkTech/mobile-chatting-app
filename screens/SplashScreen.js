import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { auth } from "../configs/firebase_configurations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";

const SplashScreen = ({ navigation }) => {


    useEffect(() => {
        // Listen for authentication state changes
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in
                await AsyncStorage.setItem("FULLNAME", user.displayName? user.displayName : "User");
                await AsyncStorage.setItem("EMAIL", user.email);
                await AsyncStorage.setItem("USERID", user.uid);
                await AsyncStorage.setItem("PROFILEPICURL", user.photoURL? user.photoURL: "");
                navigation.replace("home");
            } else {
                // No user is signed in
                navigation.replace("login");
            }
        });

        // Clean up the listener when the component unmounts
        return () => unsubscribe();
    }, [navigation]);


    return (
        <View style={styles.container}>
            {/* <Text style={styles.title}>Welcome</Text> */}
            <ActivityIndicator size="large" color="#00e5e5" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        fontWeight: "700",
    },
});

export default SplashScreen;
