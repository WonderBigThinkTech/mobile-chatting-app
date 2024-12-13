import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../configs/Colors';
import { auth, db } from '../configs/firebase_configurations';
import { collection, doc, where, query, onSnapshot, orderBy, setDoc, deleteDoc } from 'firebase/firestore';
import ContactRow from "../components/ContactRow";

const ChatsScreen = () => {
  const navigation = useNavigation();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disableChatFab, setDisableChatFab] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    const collectionRef = collection(db, 'chats');
    const q = query(collectionRef,
      where('users', "array-contains", { email: auth?.currentUser?.email, name: auth?.currentUser?.displayName, profileImage: auth?.currentUser?.photoURL, deletedFromChat: false }),
      orderBy("lastUpdated", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const filteredChats = snapshot.docs.filter(doc => {
        const users = doc.data().users;
        return users.some(user =>
          user.email === auth?.currentUser?.email &&
          user.name === auth?.currentUser?.displayName &&
          user.deletedFromChat === false
        );
      });

      setChats(filteredChats);
      setLoading(false);
    });


    updateNavigationOptions();

    return () => unsubscribe();
  }, [chats]);

  useEffect(() => {
    updateNavigationOptions();
  }, [selectedItems]);

  const renderDeleteChatFab = useMemo(() => (props) => (
    <FAB
      style={styles.fab}
      small
      icon="message"
      color="#fff"
      onPress={updateNavigationOptions}
    />
  ), []);

  const handleFabBtn = () => {
    if (disableChatFab) {
      handleDeleteChat();
    } else {
      handleFabPress();
    }
  }

  const updateNavigationOptions = () => {
    if (selectedItems.length > 0) {
      setDisableChatFab(true);
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity style={styles.trashBin} onPress={handleDeleteChat}>
            <Ionicons name="trash" size={24} color={colors.teal} />
          </TouchableOpacity>
        ),
        headerLeft: () => (
          <Text style={styles.itemCount}>{selectedItems.length}</Text>
        ),
      });
    } else {

      setDisableChatFab(false);
      // navigation.setOptions({
      //     headerRight: null,
      //     headerLeft: null,
      // });
    }
  };

  const handleChatName = (chat) => {
    const users = chat.data().users;
    const currentUser = auth?.currentUser;

    if (chat.data().groupName) {
      return chat.data().groupName;
    }

    let showChatName = '~ No Name or Email ~';

    if (currentUser.displayName === users[0].name) {
      if (currentUser.displayName === users[1].name) {
        showChatName = `${currentUser.displayName} *(You)`;
      }
      showChatName = users[1].name;
    } else if (showChatName) {
      showChatName = users[0].name;
    }

    return showChatName;
  };

  const handleChatImage = (chat) => {
    if (chat.data().profileImage) {
      return chat.data().profileImage;
    }
    return "";
  };

  const handleOnPress = (chat) => {
    if (selectedItems.length) {
      return selectItems(chat);
    }
    navigation.navigate('Chat', { id: chat.id, chatName: handleChatName(chat), chatImage: handleChatImage(chat) });
  };

  const handleLongPress = (chat) => {
    selectItems(chat);
  };

  const selectItems = (chat) => {
    if (selectedItems.includes(chat.id)) {
      setSelectedItems(selectedItems.filter(item => item !== chat.id));
    } else {
      setSelectedItems([...selectedItems, chat.id]);
    }
  };

  const getSelected = (chat) => {
    return selectedItems.includes(chat.id);
  };

  const deSelectItems = () => {
    setSelectedItems([]);
    setDisableChatFab(false);
  };

  const handleFabPress = () => {
    navigation.navigate('ChatUsers');
  };

  const handleDeleteChat = () => {
    Alert.alert(
      selectedItems.length > 1 ? "Delete selected chats?" : "Delete this chat?",
      "Messages will be removed from this device.",
      [
        {
          text: "Delete chat",
          onPress: () => {
            selectedItems.forEach(chatId => {
              const chat = chats.find(chat => chat.id === chatId);
              const updatedUsers = chat.data().users.map(user =>
                user.email === auth?.currentUser?.email
                  ? { ...user, deletedFromChat: true }
                  : user
              );

              setDoc(doc(db, 'chats', chatId), { users: updatedUsers }, { merge: true });

              const deletedUsers = updatedUsers.filter(user => user.deletedFromChat).length;
              if (deletedUsers === updatedUsers.length) {
                deleteDoc(doc(db, 'chats', chatId));
              }
            });
            deSelectItems();
          },
        },
        { text: "Cancel" },
      ],
      { cancelable: true }
    );
  };

  const handleSubtitle = (chat) => {
    const message = chat.data().messages[0];
    if (!message) return "No messages yet";

    const isCurrentUser = auth?.currentUser?.email === message.user._id;
    const userName = isCurrentUser ? 'You' : message.user.name.split(' ')[0];
    const messageText = message.image ? 'sent an image' : message.text.length > 20 ? `${message.text.substring(0, 20)}...` : message.text;

    return `${userName}: ${messageText}`;
  };

  const handleSubtitle2 = (chat) => {
    const options = { year: '2-digit', month: 'numeric', day: 'numeric' };
    return new Date(chat.data().lastUpdated).toLocaleDateString(undefined, options);
  };


  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigation.navigate('ChatScreen', { chatId: item.id })}
    >
      <Image source={{ uri: item.profilePic }} style={styles.profilePic} />
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.lastMessage}>{item.lastMessage}</Text>
      </View>
      <Text style={styles.timestamp}>{item.timestamp}</Text>
    </TouchableOpacity>
  );

  return (
    <Pressable style={styles.container} onPress={deSelectItems}>
      {loading ? (
        <ActivityIndicator size='large' style={styles.loadingContainer} />
      ) : chats.length === 0 ? (
        <View style={styles.blankContainer}>
          <Text style={styles.textContainer}>No conversations yet</Text>
        </View>
      ) : (
        <ScrollView>
          {chats.map(chat => (
            <React.Fragment key={chat.id}>
              <ContactRow
                style={getSelected(chat) ? styles.selectedContactRow : ""}
                name={handleChatName(chat)}
                image={handleChatImage(chat)}
                subtitle={handleSubtitle(chat)}
                subtitle2={handleSubtitle2(chat)}
                onPress={() => handleOnPress(chat)}
                onLongPress={() => handleLongPress(chat)}
                selected={getSelected(chat)}
                showForwardIcon={false}
              />
            </React.Fragment>))}
        </ScrollView>)
      }
      <FAB
        style={styles.fab}
        small
        icon={disableChatFab ? "delete" : "message"}
        color="#fff"
        label={disableChatFab ? selectedItems.length.toString() : ""}
        onPress={handleFabBtn}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  blankContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    fontSize: 16
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.teal
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  chatInfo: {
    flex: 1,
    marginLeft: 15,
  },
  chatName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  lastMessage: {
    color: '#7f8c8d',
  },
  timestamp: {
    color: '#95a5a6',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    // backgroundColor: '#6200ee',
    backgroundColor: colors.fabBackgroundColor,
  },
  list: {
    paddingBottom: 100, // Add extra padding to prevent overlap with the FAB
  },
});

export default ChatsScreen;
