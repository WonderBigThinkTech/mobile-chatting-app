import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import MessageCard from "./MessageCard";
import Loader from "./Loader";
import { db } from "./firebase_configurations";
import { collection, query, where, getDocs, orderBy, limit, deleteDoc, doc } from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";

const ConversationsComponent = ({ userId, navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const conversationsCollection = collection(db, "conversations");
      const conversationsQuery = query(conversationsCollection, where("sender.userId", "==", userId));
      const conversationsSnapshot = await getDocs(conversationsQuery);

      const conversationsData = [];
      await Promise.all(
        conversationsSnapshot.docs.map(async (docSnapshot) => {
          const conversation = docSnapshot.data();
          const conversationId = docSnapshot.id;

          const messagesCollection = collection(db, "conversations", conversationId, "messages");
          const messagesQuery = query(messagesCollection, orderBy("time", "desc"), limit(1));
          const messageSnapshot = await getDocs(messagesQuery);

          if (!messageSnapshot.empty) {
            messageSnapshot.forEach((messageDoc) => {
              conversation.latestMessage = messageDoc.data();
            });
          }
          conversation.id = conversationId;
          conversationsData.push(conversation);
        })
      );

      conversationsData.sort((a, b) => {
        const aTime = a.latestMessage ? a.latestMessage.time : 0;
        const bTime = b.latestMessage ? b.latestMessage.time : 0;
        return bTime - aTime;
      });

      setConversations(conversationsData);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations])
  );

  const confirmDeleteConversation = (conversationId) => {
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this conversation?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteDoc(doc(db, "conversations", conversationId));
              fetchConversations();
            } catch (error) {
              console.error("Error deleting conversation:", error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyComponent}>
            <Text style={{ fontWeight: "700" }}>Please add people to chat</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Chat", {
                senderId: item.sender.userId,
                receiverId: item.receiver.userId,
                email: item.sender.email,
              })
            }
            onLongPress={() => confirmDeleteConversation(item.id)}
          >
            <MessageCard
              receiverId={item.receiver.userId}
              message={item.latestMessage ? item.latestMessage.text : ""}
              time={item.latestMessage ? item.latestMessage.time : ""}
            />
          </TouchableOpacity>
        )}
        ListFooterComponent={<View style={{ height: 100 }} />}
        showsVerticalScrollIndicator={false}
      />
      {/* <Loader visible={loading} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    width: "100%",
  },
  emptyComponent: {
    justifyContent: "center",
    alignItems: "center",
    margin: 30,
    padding: 30,
    height: Dimensions.get("screen").height - 300,
  },
});

export default ConversationsComponent;
