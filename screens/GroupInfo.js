import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, TextInput, Button, Image, Modal } from 'react-native';
import { colors } from '../configs/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, updateDoc, arrayUnion, where, setDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { storage, db } from '../configs/firebase_configurations'; // Your Firebase Storage configuration
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFocusEffect } from '@react-navigation/native';

const GroupInfo = ({ route, navigation }) => {
    const { chatId, chatName } = route.params;
    const [users, setUsers] = useState([]);
    const [newUsers, setNewUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [groupName, setGroupName] = useState('');
    const [editingGroupName, setEditingGroupName] = useState(false);
    const [groupImage, setGroupImage] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [members, setMembers] = useState([]);
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');

    useFocusEffect(
        useCallback(() => {
            fetchChatInfo();
            const collectionUserRef = collection(db, 'users');
            const q = query(collectionUserRef, orderBy("fullName", "asc"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setNewUsers(snapshot.docs);
            });
            return () => unsubscribe();
        }, [])
    );

    const fetchChatInfo = async () => {
        try {
            const chatRef = doc(db, 'groups', chatId);
            const chatDoc = await getDoc(chatRef);

            if (chatDoc.exists()) {
                const chatData = chatDoc.data();
                if (chatData) {
                    setUsers(chatData.users || []);
                    setGroupName(chatData.groupName || '');
                    setGroupImage(chatData.groupImage || null);
                    setAdmins(chatData.groupAdmins || []);
                    setMembers(chatData.users.filter((e) => e.isAdmin === false) || []);
                }
            } else {
                Alert.alert("Error", "Chat does not exist");
            }
        } catch (error) {
            Alert.alert("Error", "An error occurred while fetching chat info");
            // console.error("Error fetching chat info: ", error);
        }
    };

    const handleEditGroupName = async () => {
        try {
            const chatRef = doc(db, 'groups', chatId);
            await updateDoc(chatRef, { groupName: groupName });
            setEditingGroupName(false);
        } catch (error) {
            Alert.alert("Error", "Failed to update group name");
            // console.error("Error updating group name: ", error);
        }
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            const { uri } = result.assets[0];
            uploadImage(uri);
        }
    };

    const uploadImage = async (uri) => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const filename = `group_images/${Date.now()}`;
            const imageRef = ref(storage, filename);
            await uploadBytes(imageRef, blob);
            const downloadURL = await getDownloadURL(imageRef);
            const chatRef = doc(db, 'groups', chatId);
            await updateDoc(chatRef, { groupImage: downloadURL });
            setGroupImage(downloadURL);
        } catch (error) {
            Alert.alert('Error', 'Failed to upload image');
            // console.error('Upload Image Error: ', error);
        }
    };

    const handleToggleSelectUser = (userEmail) => {
        setSelectedUsers(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(userEmail)) {
                newSelected.delete(userEmail);
            } else {
                newSelected.add(userEmail);
            }
            return newSelected;
        });
    };

    const handleDeleteSelectedUsers = async () => {
        Alert.alert(
            'Confirm Deletion',
            'Are you sure you want to delete the selected members?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            const updatedUsers = users.map(user =>
                                selectedUsers.has(user.email) ? { ...user, deletedFromChat: true } : user
                            );
                            const chatRef = doc(db, 'groups', chatId);
                            await updateDoc(chatRef, { users: updatedUsers });
                            setUsers(updatedUsers);
                            setSelectedUsers(new Set()); // Clear selection after deletion
                            fetchChatInfo();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete selected users');
                            // console.error('Delete Users Error: ', error);
                        }
                    },
                    style: 'destructive'
                }
            ],
            { cancelable: true }
        );
    };

    const handleAddAdmin = async () => {
        if (newAdminEmail.trim() === '') {
            Alert.alert('Error', 'Email cannot be empty');
            return;
        }

        try {
            const chatRef = doc(db, 'groups', chatId);

            // Fetch current chat data to check if the user is already present or deleted
            const chatDoc = await getDoc(chatRef);
            const chatData = chatDoc.data();
            const existingUser = chatData.groupAdmins.find(e => e.email === newAdminEmail);

            if (existingUser) {
                // If user is found and was previously removed, update their status
                Alert.alert('Info', 'Admin is already in the chat');

            } else {
                // If user is not in the chat, add them as a new member
                const newAdmin = chatData.users.find(e => e.email === newAdminEmail);
                newAdmin.isAdmin = true;
                const updatedAdmins = [...chatData.groupAdmins, { ...newAdmin }];
                await updateDoc(chatRef, {
                    groupAdmins: updatedAdmins
                });
                setUsers(prevUsers => [...prevUsers, newAdminEmail]);
                fetchChatInfo();
                Alert.alert('Info', 'Admin is added in the chat');
            }

            setNewAdminEmail('');
            setShowAddAdminModal(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to add new Admin');
            // console.error('Add Admin Error: ', error);
        }
    };
    const handleAddMember = async () => {
        if (newMemberEmail.trim() === '') {
            Alert.alert('Error', 'Email cannot be empty');
            return;
        }

        try {
            const chatRef = doc(db, 'groups', chatId);

            // Fetch current chat data to check if the user is already present or deleted
            const chatDoc = await getDoc(chatRef);
            const chatData = chatDoc.data();
            const existingUser = chatData.users.find(user => user.email === newMemberEmail);

            if (existingUser) {
                // If user is found and was previously removed, update their status
                if (existingUser.deletedFromChat) {
                    const updatedUsers = chatData.users.map(user =>
                        user.email === newMemberEmail ? { ...user, deletedFromChat: false } : user
                    );
                    await updateDoc(chatRef, { users: updatedUsers });
                } else {
                    Alert.alert('Info', 'Member is already in the chat');
                }
            } else {
                // If user is not in the chat, add them as a new member
                const memberToAdd = newUsers
                    .filter(user => user.data().email === newMemberEmail)
                    .map(user => ({
                        profileImage: user.data().profilePicUrl,
                        email: user.data().email,
                        name: user.data().fullName,
                        deletedFromChat: false,
                        isAdmin: false
                    }));

                if (memberToAdd.length > 0) {
                    const updatedMembers = [...chatData.users, ...memberToAdd];
                    await updateDoc(chatRef, {
                        users: updatedMembers
                    });
                    setUsers(prevUsers => [...prevUsers, memberToAdd]);
                    fetchChatInfo();
                    Alert.alert('Info', 'Member is added in the chat');
                } else {
                    Alert.alert('Failed', 'Member is not available');
                }
            }

            setNewMemberEmail('');
            setShowAddMemberModal(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to add new member');
            // console.error('Add Member Error: ', error);
        }
    };

    const renderMembers = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.flatListContainer,
                { backgroundColor: selectedUsers.has(item.email) ? '#e0e0e0' : 'white' }
            ]}
            onLongPress={item.deletedFromChat ? () => { } : () => handleToggleSelectUser(item.email)}
        >
            {item.profileImage ? <Image
                source={{ uri: item.profileImage }}
                style={styles.avatarPic}
            /> :
                <Ionicons name={item.deletedFromChat ? "person-remove-outline" : "person-outline"} size={30} color="black" />}
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                {item.deletedFromChat && <Text style={styles.deletedText}>This user has been removed</Text>}
            </View>
            {!item.deletedFromChat && (
                <TouchableOpacity onPress={() => handleToggleSelectUser(item.email)}>
                    <Ionicons name={selectedUsers.has(item.email) ? "checkmark-circle" : null} size={24} color="green" />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
    const renderAdmin = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.flatListContainer,
                { backgroundColor: 'white' }
            ]}
        >

            {item.profileImage ? <Image
                source={{ uri: item.profileImage }}
                style={styles.avatarPic}
            /> : <Ionicons name={"person-outline"} size={30} color="black" />}
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name ? item.name : "Name not Available"}</Text>
                <Text style={styles.userEmail}>{item.email ? item.email : "Email not Available"}</Text>
            </View>
        </TouchableOpacity>
    );

    const uniqueUsers = Array.from(new Map(members.map(user => [user.email, user])).values());

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity onPress={handlePickImage} style={styles.avatar}>
                {groupImage ? (
                    <Image source={{ uri: groupImage }} style={styles.avatarPic} />
                ) : (
                    <Text style={styles.avatarLabel}>
                        {chatName.split(' ').reduce((prev, current) => `${prev}${current[0]}`, '')}
                    </Text>
                )}
            </TouchableOpacity>
            <View style={styles.groupTitleHeader}>
                {groupName ? <Text style={styles.groupLabel}>Group🔹</Text> : null}
                <Text style={styles.groupTitle}>{groupName || chatName}</Text>
                {groupName ? (
                    <TouchableOpacity style={styles.editGroupPencil} onPress={() => setEditingGroupName(!editingGroupName)}>
                        <Ionicons name={"pencil"} size={24} color="black" />
                    </TouchableOpacity>
                ) : null}
            </View>
            {groupName && (
                <View style={styles.membersHeader}>
                    <Text style={styles.flatListTitle}>Admins</Text>
                    <TouchableOpacity onPress={() => setShowAddAdminModal(true)} style={styles.addButton}>
                        <Ionicons name="add-circle-outline" size={24} color="black" />
                    </TouchableOpacity>
                </View>
            )}
            {groupName && (
                <FlatList
                    data={admins}
                    renderItem={renderAdmin}
                    keyExtractor={(item) => item.email}
                    contentContainerStyle={styles.adminsList}
                />
            )}
            {groupName && (
                <View style={styles.membersHeader}>
                    <Text style={styles.flatListTitle}>Members</Text>
                    <TouchableOpacity onPress={() => setShowAddMemberModal(true)} style={styles.addButton}>
                        <Ionicons name="add-circle-outline" size={24} color="black" />
                    </TouchableOpacity>
                </View>
            )}
            {groupName && (
                <FlatList
                    data={uniqueUsers}
                    renderItem={renderMembers}
                    keyExtractor={(item) => item.email}
                    contentContainerStyle={styles.memberList}
                />

            )}

            {selectedUsers.size > 0 && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={handleDeleteSelectedUsers}
                >
                    <Ionicons name="trash-outline" size={24} color="white" />
                </TouchableOpacity>
            )}

            <Modal
                transparent={true}
                visible={showAddMemberModal}
                animationType="slide"
                onRequestClose={() => setShowAddMemberModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter email"
                            value={newMemberEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            onChangeText={setNewMemberEmail}
                        />
                        <View style={styles.modalButtons}>
                            <Button title="Add Member" onPress={handleAddMember} />
                            <Button title="Cancel" onPress={() => setShowAddMemberModal(false)} color="red" />
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                transparent={true}
                visible={showAddAdminModal}
                animationType="slide"
                onRequestClose={() => setShowAddAdminModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter email"
                            value={newAdminEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            onChangeText={setNewAdminEmail}
                        />
                        <View style={styles.modalButtons}>
                            <Button title="Add Admin" onPress={handleAddAdmin} />
                            <Button title="Cancel" onPress={() => setShowAddAdminModal(false)} color="red" />
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                transparent={true}
                visible={editingGroupName}
                animationType="slide"
                onRequestClose={() => setEditingGroupName(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter New Group Name"
                            value={groupName}
                            autoCapitalize="none"
                            onChangeText={setGroupName}
                        />
                        <View style={styles.modalButtons}>
                            <Button title="Change" onPress={handleEditGroupName} />
                            <Button title="Cancel" onPress={() => setEditingGroupName(false)} color="red" />
                        </View>
                    </View>
                </View>
            </Modal>
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
    groupTitleHeader: {
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
    editGroupPencil: {
        marginLeft: 10,
    },
    flatListTitle: {
        paddingHorizontal: 10,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#555',
        flex: 1,
    },
    groupTitle: {
        fontSize: 18,
        fontWeight: '500',
        alignSelf: 'center',
        color: '#555',
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        fontSize: 18,
        marginRight: 8,
        flex: 1,
    },
    flatListContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    memberText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#000',
    },
    adminsList: {
        marginTop: 10,
    },
    memberList: {
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
    avatarPic: {
        width: 50,
        height: 50,
        borderRadius: 75,
        borderColor: "#00e5e5",
        borderWidth: 2,
    },
    deletedText: {
        fontSize: 12,
        color: 'red',
        marginTop: 5,
    },
    fab: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
    },
    membersHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addButton: {
        marginRight: 10,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalInput: {
        width: '100%',
        borderBottomWidth: 1,
        marginBottom: 20,
        fontSize: 18,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
});

export default GroupInfo;
