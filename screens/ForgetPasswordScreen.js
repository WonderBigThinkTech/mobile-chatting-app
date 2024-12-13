import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import TextInputWithIcon from "../components/TextInputWithIcon";
import { StatusBar } from "expo-status-bar";
import { auth } from "../configs/firebase_configurations";
import { sendPasswordResetEmail } from "firebase/auth";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const ForgetPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendResetEmail = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email.");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Success", "If the email is registered, a password reset link will be sent to it.");
      navigation.replace("login"); // Navigate to login screen after sending the email
    } catch (error) {

      let errorMessage = "An unexpected error occurred. Please try again.";

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = "The email address is not valid.";
          break;
        case 'auth/missing-email':
          errorMessage = "Please provide an email address.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your internet connection.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many requests. Please try again later.";
          break;
        case 'auth/internal-error':
          errorMessage = "An internal error occurred. Please try again.";
          break;
        default:
          errorMessage = error.message || errorMessage;
          break;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.headingInBlack}>Forget Password?</Text>
        <Text style={styles.textInBlack}>Email</Text>
        <TextInputWithIcon
          placeholder="example@gmail.com"
          width={screenWidth - 40}
          iconColor={"#ccc"}
          icon={"email-outline"}
          Family={MaterialCommunityIcons}
          onChangeText={setEmail}
          value={email}
        />
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleSendResetEmail}
        >
          <Text style={styles.buttonText}>Send Reset Email</Text>
        </TouchableOpacity>

        {loading && (
          <ActivityIndicator
            color={"#00e5e5"}
            size={40}
            style={{ marginVertical: 10 }}
          />
        )}
      </View>
      <TouchableOpacity onPress={() => navigation.replace("login")}>
        <Text style={styles.goBackToSignIn}>Go Back to Sign In</Text>
      </TouchableOpacity>
      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: screenHeight,
    backgroundColor: "#fff",
    alignItems: "center",
    alignContent: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    alignItems: "center",
  },
  headingInBlack: {
    fontWeight: "600",
    fontSize: 25,
    marginTop: 5,
  },
  descInBlack: {
    fontWeight: "600",
    fontSize: 18,
    marginTop: 5,
  },
  textInBlack: {
    fontWeight: "600",
    fontSize: 15,
    marginTop: 5,
    alignSelf: "flex-start",
  },
  resetButton: {
    backgroundColor: "#00e5e5",
    height: 40,
    width: screenWidth / 2,
    borderRadius: 35,
    marginVertical: 20,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  goBackToSignIn: {
    color: "gray",
    fontWeight: "400",

  }
});

export default ForgetPasswordScreen;
