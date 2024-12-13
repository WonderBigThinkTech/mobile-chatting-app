import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, Pressable, ScrollView, TouchableOpacity, Modal, TextInput, Button } from "react-native";
import { colors } from "../configs/Colors";
import { auth, db } from '../configs/firebase_configurations';
import { useNavigation } from "@react-navigation/native";
import { collection, doc, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import ContactRow from "../components/ContactRow";
import { Ionicons } from '@expo/vector-icons';

const GroupUsersScreen = () => {
    const navigation = useNavigation();
    const [selectedItems, setSelectedItems] = useState([]);
    const [users, setUsers] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [groupName, setGroupName] = useState("");

    useEffect(() => {
        const collectionUserRef = collection(db, 'users');
        const q = query(collectionUserRef, orderBy("fullName", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUsers(snapshot.docs);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                selectedItems.length > 0 && <Text style={styles.itemCount}>{selectedItems.length}</Text>
            ),
        });
    }, [selectedItems]);

    const handleName = (user) => {
        if (user.data().name) {
            return user.data().email === auth?.currentUser?.email ? `${user.data().fullName}*(You)` : user.data().fullName;
        }
        return user.data().email ? user.data().email : '~ No Name or Email ~';
    }

    const handleImage = (user) => {
        const image = user.data().profilePicUrl;
        if (image) {
            return image;
        } else {
            return "";
        }
    };


    const handleSubtitle = (user) => {
        return user.data().email === auth?.currentUser?.email ? 'Message yourself' : 'User status';
    }

    const handleOnPress = (user) => {
        selectItems(user);
    }

    const selectItems = (user) => {
        setSelectedItems((prevItems) => {
            if (prevItems.includes(user.id)) {
                return prevItems.filter(item => item !== user.id);
            }
            return [...prevItems, user.id];
        });
    }

    const getSelected = (user) => selectedItems.includes(user.id);

    const deSelectItems = () => {
        setSelectedItems([]);
    };

    const handleFabPress = () => {
        setModalVisible(true);
    }

    const handleCreateGroup = () => {
        if (!groupName.trim()) {
            alert('Group name cannot be empty');
            return;
        }

        const usersToAdd = users
            .filter(user => selectedItems.includes(user.id))
            .map(user => ({ profileImage: user.data().profilePicUrl, email: user.data().email, name: user.data().fullName, deletedFromChat: false, isAdmin: false }));

        usersToAdd.unshift({ profileImage: auth?.currentUser?.photoURL, email: auth?.currentUser?.email, name: auth?.currentUser?.displayName, deletedFromChat: false, isAdmin: true });

        adminToAdd = { profileImage: auth?.currentUser?.photoURL, email: auth?.currentUser?.email, name: auth?.currentUser?.displayName, deletedFromChat: false, isAdmin: true };

        const newRef = doc(collection(db, "groups"));
        setDoc(newRef, {
            lastUpdated: Date.now(),
            users: usersToAdd,
            messages: [],
            groupName: groupName,
            groupAdmins: [adminToAdd],
        }).then(() => {
            navigation.navigate('GroupChat', { id: newRef.id, chatName: groupName });
            deSelectItems();
            setModalVisible(false);
            setGroupName("");
        });
    }

    return (
        <Pressable style={styles.container} onPress={deSelectItems}>
            {users.length === 0 ?
                <View style={styles.blankContainer}>
                    <Text style={styles.textContainer}>No registered users yet</Text>
                </View>
                : <ScrollView>
                    {users.map(user => (
                        <React.Fragment key={user.id}>
                            <ContactRow
                                style={getSelected(user) ? styles.selectedContactRow : ""}
                                name={handleName(user)}
                                image={handleImage(user)}
                                subtitle={handleSubtitle(user)}
                                onPress={() => handleOnPress(user)}
                                selected={getSelected(user)}
                                showForwardIcon={false}
                            />
                        </React.Fragment>
                    ))}
                </ScrollView>
            }
            {modalVisible === false &&
                selectedItems.length > 0 &&
                (
                    <TouchableOpacity style={styles.fab} onPress={handleFabPress}>
                        <View style={styles.fabContainer}>
                            <Ionicons name="arrow-forward-outline" size={24} color={'white'} />
                        </View>
                    </TouchableOpacity>
                )
            }
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>Enter Group Name</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setGroupName}
                        autoFocus={true}
                        value={groupName}
                        placeholder="Group Name"
                    // onSubmitEditing={handleCreateGroup} // Create group on submit
                    />
                    <View style={styles.modalButtons}>
                        <Button title="Create" onPress={handleCreateGroup} />
                        <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
                    </View>
                </View>
            </Modal>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 12,
        right: 12
    },
    fabContainer: {
        width: 56,
        height: 56,
        backgroundColor: colors.teal,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1
    },
    textContainer: {
        fontSize: 16
    },
    blankContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedContactRow: {
        backgroundColor: '#E0E0E0'
    },
    itemCount: {
        right: 10,
        color: colors.teal,
        fontSize: 18,
        fontWeight: "400",
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        elevation: 5
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center",
        fontSize: 20,
        fontWeight: "bold"
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 15,
        width: '100%',
        paddingHorizontal: 10
    }
});

export default GroupUsersScreen;
