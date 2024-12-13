import React from 'react';
import { TouchableOpacity, Text, View, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from "../configs/Colors";

const GroupChatHeader = ({ chatName, chatId, chatImage }) => {
    const navigation = useNavigation();

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => navigation.navigate('GroupInfo', { chatId, chatName })}
        >
            <TouchableOpacity
                style={styles.avatar}
                onPress={() => navigation.navigate('GroupInfo', { chatId, chatName })}
            >
                {chatImage ? (
                    <Image source={{ uri: chatImage }} style={styles.avatarImage} />
                ) : (
                    <Text style={styles.avatarLabel}>
                        {chatName ? chatName.split(' ').reduce((prev, current) => `${prev}${current[0]}`, '') : ""}
                    </Text>
                )}
            </TouchableOpacity>

            <Text style={styles.chatName}>{chatName}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: "white",
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    avatarLabel: {
        fontSize: 20,
        color: 'black'
    },
    chatName: {
        fontSize: 18,
        color: 'white',
    },
});

export default GroupChatHeader;
