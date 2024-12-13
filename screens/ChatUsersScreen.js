import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView, StyleSheet, View, Text, ScrollView } from "react-native";
import { useNavigation } from '@react-navigation/native';
import ContactRow from '../components/ContactRow';
import Separator from "../components/Separator";
import { auth, db } from '../configs/firebase_configurations';
import { collection, doc, onSnapshot, setDoc, query, orderBy, where } from 'firebase/firestore';
import { colors } from "../configs/Colors";
import Cell from "../components/Cell";
import Loader from "../components/Loader";

const ChatUsersScreen = () => {
    const navigation = useNavigation();
    const [users, setUsers] = useState([]);
    const [existingChats, setExistingChats] = useState([]);
    const [showLoading, setShowLoading] = useState(false);

    useEffect(() => {
        const collectionUserRef = collection(db, 'users');
        const q = query(collectionUserRef, orderBy("fullName", "asc"));
        const unsubscribeUsers = onSnapshot(q, (snapshot) => {
            setUsers(snapshot.docs);
        });

        // Get existing chats to avoid creating duplicate chats
        const collectionChatsRef = collection(db, 'chats');
        const q2 = query(
            collectionChatsRef,
            where('users', "array-contains", { email: auth?.currentUser?.email, name: auth?.currentUser?.displayName, profileImage: auth?.currentUser?.photoURL, deletedFromChat: false }),
        );
        const unsubscribeChats = onSnapshot(q2, (snapshot) => {
            const existing = snapshot.docs.map(existingChat => ({
                chatId: existingChat.id,
                userEmails: existingChat.data().users
            }));
            setExistingChats(existing);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeChats();
        };
    }, []);

    const handleNavigate = useCallback((user) => {
        setShowLoading(true);
        let navigationChatID = '';
        let messageYourselfChatID = '';

        existingChats.forEach(existingChat => {
            const isCurrentUserInTheChat = existingChat.userEmails.some(e => e.email === auth?.currentUser?.email);
            const isMessageYourselfExists = existingChat.userEmails.filter(e => e.email === user.data().email).length;

            if (isCurrentUserInTheChat && existingChat.userEmails.some(e => e.email === user.data().email)) {
                navigationChatID = existingChat.chatId;
            }

            if (isMessageYourselfExists === 2) {
                messageYourselfChatID = existingChat.chatId;
            }

            if (auth?.currentUser?.email === user.data().email) {
                navigationChatID = '';
            }
        });

        if (messageYourselfChatID) {
            setShowLoading(false);
            navigation.replace('Chat', { id: messageYourselfChatID, chatName: handleName(user), chatImage: handleImage(user), });
        } else if (navigationChatID) {
            setShowLoading(false);
            navigation.replace('Chat', { id: navigationChatID, chatName: handleName(user), chatImage: handleImage(user), });
        } else {
            // Creates new chat
            const newRef = doc(collection(db, "chats"));
            setDoc(newRef, {
                lastUpdated: Date.now(),
                users: [
                    { email: auth?.currentUser?.email, name: auth?.currentUser?.displayName, profileImage: auth?.currentUser?.photoURL, deletedFromChat: false },
                    { email: user.data().email, name: user.data().fullName, profileImage: user.data().profilePicUrl, deletedFromChat: false }
                ],
                lastAccess: [
                    { email: auth?.currentUser?.email, date: Date.now() },
                    { email: user.data().email, date: '' }
                ],
                messages: []
            }).then(() => {
                setShowLoading(false);
                navigation.replace('Chat', { id: newRef.id, chatName: handleName(user), chatImage: handleImage(user) });
            });
        }
    }, [existingChats, navigation]);

    const handleSubtitle = useCallback((user) => {
        return user.data().email === auth?.currentUser?.email ? 'Message yourself' : 'User status';
    }, []);

    const handleName = useCallback((user) => {
        const name = user.data().fullName;
        const email = user.data().email;
        if (name) {
            return email === auth?.currentUser?.email ? `${name}*(You)` : name;
        }
        return email ? email : '~ No Name or Email ~';
    }, []);
    const handleImage = useCallback((user) => {
        const profilePicUrl = user.data().profilePicUrl;
        const email = user.data().email;
        if (profilePicUrl) {
            return email === auth?.currentUser?.email ? profilePicUrl : profilePicUrl;
        }
        return "";
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            {users.length === 0 ? (
                <View style={styles.blankContainer}>
                    <Text style={styles.textContainer}>
                        No registered users yet
                    </Text>
                </View>
            ) : (
                <ScrollView>
                    {users.map(user => (
                        <React.Fragment key={user.id}>
                            <ContactRow
                                name={handleName(user)}
                                image={handleImage(user)}
                                subtitle={handleSubtitle(user)}
                                onPress={() => handleNavigate(user)}
                                showForwardIcon={false}
                            />
                        </React.Fragment>
                    ))}
                </ScrollView>
            )}
            <Loader visible={showLoading} />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    blankContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        marginLeft: 16,
        fontSize: 16,
        fontWeight: "300",
    }
});

export default ChatUsersScreen;