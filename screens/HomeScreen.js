import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Ionicons } from "@expo/vector-icons";
import ChatsScreen from "./ChatsScreen";
import { auth } from "../configs/firebase_configurations";
import { onAuthStateChanged } from "firebase/auth";
import GroupsScreen from "./GroupsScreen";

const Tab = createMaterialTopTabNavigator();

const Header = (
    { userProfileURL, navigation, userId }
) => (<View style={styles.header}>
    <Text style={styles.headerTitle}>Whatsup.X.no</Text>
    <TouchableOpacity
        onPress={() => navigation.navigate("Profile", { userId })}
        style={styles.profileContainer}
    >
        {userProfileURL ? (
            <Image source={{ uri: userProfileURL }} style={styles.profilePicHeader} />
        ) : (
            <View style={styles.defaultProfilePic}>
                <Ionicons name="person-circle" size={35} color="#00e5e5" />
            </View>
        )}
    </TouchableOpacity>
</View>
);

const HomeScreen = ({ navigation }) => {

    const [userId, setUserId] = useState(null);
    const [userEmail, setEmail] = useState(null);
    const [userProfileURL, setUserProfileURL] = useState(null);

    // Function to fetch user data
    const fetchUserData = () => {
        const user = auth.currentUser;
        if (user) {
            setUserId(user.uid);
            setEmail(user.email);
            setUserProfileURL(user.photoURL || '');
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchUserData();
        }, [])
    );

    return (
        <>
            <Header
                userProfileURL={userProfileURL} navigation={navigation} userId={userId}
            />
            <Tab.Navigator
                screenOptions={{
                    tabBarActiveTintColor: "#fff",
                    tabBarInactiveTintColor: "#00b7b7",
                    tabBarIndicatorStyle: {
                        backgroundColor: "#00e5e5",
                        fontWeight: "bold",
                    },
                    tabBarStyle: {
                        backgroundColor: "#00e5e5",
                    },
                    tabBarLabelStyle: {
                        fontWeight: "bold",
                    },
                }}
            >
                <Tab.Screen name="Chats" component={ChatsScreen} />
                <Tab.Screen name="Groups" component={GroupsScreen} />
            </Tab.Navigator>
        </>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 20,
        backgroundColor: "#00e5e5",
        paddingTop: 50,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: "#fff",
    },
    profileContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    profilePicHeader: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#fff",
        borderRadius: 50,
    },
    defaultProfilePic: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#fff",
        borderRadius: 50,
    },
});

export default HomeScreen;
