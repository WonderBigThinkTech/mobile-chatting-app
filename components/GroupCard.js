import React, { Component } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import { firebase } from "../configs/firebase_configurations";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

class GroupCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      groupName: "",
      groupImage: null,
      lastMessage: "",
      lastMessageTime: null,
      creatorId: "", 
    };
  }

  fetchGroupData = async () => {
    const { groupId } = this.props;
    try {
      const groupSnapshot = await firebase
        .firestore()
        .collection("groups")
        .doc(groupId)
        .get();

      if (groupSnapshot.exists) {
        const groupData = groupSnapshot.data();
        this.setState({
          groupName: groupData.name,
          groupImage: groupData.image,
          creatorId: groupData.creatorId, // Set creatorId from Firestore
        });

        const lastMessageSnapshot = await firebase
          .firestore()
          .collection("groups")
          .doc(groupId)
          .collection("messages")
          .orderBy("time", "desc")
          .limit(1)
          .get();

        if (!lastMessageSnapshot.empty) {
          const lastMessageData = lastMessageSnapshot.docs[0].data();
          this.setState({
            lastMessage: lastMessageData.text || "",
            lastMessageTime: lastMessageData.time || null,
          });
        }
      } else {
        console.error("Group document does not exist");
      }
    } catch (error) {
      console.error("Error fetching group data:", error);
    }
  };

  componentDidMount = async () => {
    this.fetchGroupData();
    this.props.navigation.addListener("focus", this.fetchGroupData);
  };

  componentWillUnmount() {
    this.props.navigation.removeListener("focus", this.fetchGroupData);
  }

  navigateToGroupScreen = () => {
    const { groupId, userId } = this.props;
    this.props.navigation.navigate("GroupScreen", {
      groupId: groupId,
      userId: userId,
    });
  };

  handleLongPress = () => {
    const { creatorId } = this.state;
    const { userId, groupId } = this.props;

    if (creatorId === userId) {
      Alert.alert(
        "Delete Group",
        "Are you sure you want to delete this group?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: () => this.deleteGroup(groupId),
            style: "destructive",
          },
        ]
      );
    }
  };

  deleteGroup = async (groupId) => {
    try {
      await firebase.firestore().collection("groups").doc(groupId).delete();
      if (this.props.onGroupDeleted) {
        this.props.onGroupDeleted(groupId);
      }
    } catch (error) {
      console.error("Error deleting group: ", error);
    }
  };

  render() {
    const { groupName, groupImage, lastMessage, lastMessageTime } = this.state;

    return (
      <TouchableOpacity
        onPress={this.navigateToGroupScreen}
        onLongPress={this.handleLongPress} 
        style={styles.item}
      >
        <View style={styles.imageView}>
          <Image source={{ uri: groupImage }} style={styles.image} />
        </View>
        <View style={styles.infoChild}>
          <Text style={styles.headingText}>{groupName}</Text>
          <Text style={styles.textInGray} numberOfLines={1}>
            {lastMessage}
          </Text>
        </View>
        <View style={styles.messageInfo}>
          <Text style={styles.time}>
            {lastMessageTime && lastMessageTime.toDate
              ? lastMessageTime.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    backgroundColor: "white",
    borderBottomColor: "#eeeeeeee",
    borderBottomWidth: 1,
    maxHeight: 80,
    flexDirection: "row",
    alignItems: "center",
    minWidth: "95%",
    borderRadius: 10,
    shadowColor: "#351c75",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 1.84,
    elevation: 5,
    margin: 5,
  },
  imageView: {
    height: 80,
    width: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    borderRadius: 50,
    height: 60,
    width: 60,
    backgroundColor: "#ccf9f9",
  },
  infoChild: {
    flex: 3,
    justifyContent: "center",
  },
  headingText: {
    fontSize: 17,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  textInGray: {
    color: "gray",
    flex: 1,
    paddingHorizontal: 10,
  },
  messageInfo: {
    height: 80,
    width: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  time: {
    color: "gray",
    textAlign: "center",
  },
});

export default GroupCard;
