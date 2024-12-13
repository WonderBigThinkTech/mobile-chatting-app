import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '../configs/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';

const ChatInfo = ({ route }) => {
    const { chatId, chatName, chatImage } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.avatar}>
                {chatImage !== "" ? <Image
                    source={{ uri: chatImage }}
                    style={styles.avatarPic}
                /> :
                    <View>
                        <Text style={styles.avatarLabel}>
                            {chatName.split(' ').reduce((prev, current) => `${prev}${current[0]}`, '')}
                        </Text>
                    </View>}
            </TouchableOpacity>
            <Text style={styles.chatTitle}>{chatName}</Text>
            {/* <View style={styles.chatHeader}>
            </View> */}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        flex: 1,
    },
    subtitle: {
        marginTop: 2,
        color: '#565656',
    },
    avatar: {
        width: 168,
        height: 168,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        backgroundColor: colors.chatAvatarColor,
    },
    avatarPic: {
        width: 160,
        height: 160,
        borderRadius: 100,
        borderColor: "#00e5e5",
        borderWidth: 2,
    },
    avatarLabel: {
        fontSize: 20,
        color: 'white',
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    groupLabel: {
        fontSize: 18,
        fontWeight: '500',
        color: '#555',
        marginRight: 8,
    },
    usersTitle: {
        padding: 16,
        marginTop: 12,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#555',
    },
    chatTitle: {
        marginTop: 10,
        fontSize: 18,
        fontWeight: '500',
        alignSelf: 'center',
        color: '#555',
    },
    userContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    userText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#000',
    },
    usersList: {
        marginTop: 10,
    },
    userInfo: {
        marginLeft: 10,
    },
    userName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    userEmail: {
        fontSize: 14,
        color: '#555',
    },
});

export default ChatInfo;
