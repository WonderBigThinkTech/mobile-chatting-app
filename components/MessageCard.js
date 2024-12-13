import React, { Component } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { db } from "./firebase_configurations"; // Import from firebase_configurations.js
import { collection, query, where, getDocs, doc, getDoc, deleteDoc, orderBy, limit } from 'firebase/firestore';

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

class MessageCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      profile: null,
      name: "",
    };
  }

  componentDidMount = async () => {
    const { receiverId } = this.props;
    try {
      const userRef = doc(db, 'users', receiverId);
          
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists) {
        const userData = userSnapshot.data();
        this.setState({
          profile: userData.profilePicUrl,
          name: userData.fullName,
        });
      } else {
        console.error("User document does not exist");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  render() {
    const { profile, name } = this.state;
    const { message, time } = this.props;
    return (
      <View style={styles.item}>
        <View style={styles.imageView}>
          <Image source={{ uri: profile }} style={styles.image} />
        </View>
        <View style={styles.infoChild}>
          <Text style={styles.headingText}>{name}</Text>

          <Text style={styles.textInGray} numberOfLines={1}>
            {message}
          </Text>
        </View>
        <View style={styles.messageInfo}>
          <Text style={styles.time}>
            {time && time.toDate
              ? time.toDate().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
              : ""}
          </Text>
        </View>
      </View>
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
  textInGray: {
    color: "gray",
    flex: 1,
    paddingHorizontal: 10,
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

export default MessageCard;
