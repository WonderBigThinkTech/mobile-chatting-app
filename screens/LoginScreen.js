import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { auth, signInWithEmailAndPassword } from "../configs/firebase_configurations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert from "../components/CustomAlert";
import Loader from "../components/Loader";
import { CommonActions } from "@react-navigation/native";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const emailRef = useRef();
  const passwordRef = useRef();

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const validatePassword = (password) => password.length >= 6;

  const handleLogin = async () => {
    if (!validateEmail(email)) {
      showAlert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (!validatePassword(password)) {
      showAlert("Invalid Password", "Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await saveUserData(user.uid, user.email, user.displayName, user.photoURL);
      setEmail("");
      setPassword("");
      navigation.dispatch(
        CommonActions.reset({
          index: 0, // The index of the new screen to make active
          routes: [{
            name: 'home', params: {
              fullname: user.displayName,
              email: user.email,
              userId: user.uid,
              profileURL: user.photoURL,
            }
          }],
        })
      );
    } catch (error) {
      let errorMessage = "An unexpected error occurred. Please try again later.";

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No user found with this email address.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password. Please try again.";
          break;
        case "auth/invalid-email":
          errorMessage = "The email address is badly formatted.";
          break;
        case "auth/user-disabled":
          errorMessage = "This user account has been disabled.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many login attempts. Please try again later or reset your password.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your connection and try again.";
          break;
        case "auth/invalid-credential":
          errorMessage = "Invalid credentials provided. Please check your email and password.";
          break;
        default:
          errorMessage = error.message || errorMessage;
          break;
      }

      showAlert("Error Logging In", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveUserData = async (userId, email, fullname, profileURL) => {
    await AsyncStorage.setItem("FULLNAME", fullname || "");
    await AsyncStorage.setItem("USERID", userId);
    await AsyncStorage.setItem("EMAIL", email);
    await AsyncStorage.setItem("PROFILEPICURL", profileURL || "");
  };

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const closeAlert = () => setAlertVisible(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Login via Email</Text>

        <Text style={styles.textLabel}>Email</Text>
        <TextInput
          ref={emailRef}
          placeholder="example@gmail.com"
          style={styles.input}
          value={email}
          autoCapitalize="none"
          onChangeText={setEmail}
          keyboardType="email-address"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current.focus()}
        />

        <Text style={styles.textLabel}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            ref={passwordRef}
            placeholder="Password"
            style={styles.input}
            value={password}
            autoCapitalize="none"
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setPasswordVisible(!passwordVisible)}
          >
            <MaterialIcons
              name={passwordVisible ? "visibility-off" : "visibility"}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={() => navigation.navigate("Forgot")}
        ><Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>

        <Text style={styles.agreementText}>
          By continuing you agree to our{" "}
          <Text style={styles.linkText}>terms of services</Text> and{" "}
          <Text style={styles.linkText}>privacy policy.</Text>
        </Text>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("signup")}>
          <Text style={styles.signup}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
      <Loader visible={loading} />
      <CustomAlert visible={alertVisible} title={alertTitle} message={alertMessage} onClose={closeAlert} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    padding: 20,
  },
  formContainer: {
    alignItems: "center",
    marginTop: 50,
    margin: 0,
  },
  title: {
    marginBottom: 20,
    fontSize: 28,
    fontWeight: "700",
  },
  textLabel: {
    fontWeight: "600",
    fontSize: 15,
    alignSelf: "flex-start",
  },
  input: {
    width: screenWidth - 40,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginVertical: 5,
  },
  passwordContainer: {
    width: screenWidth - 40,
    flexDirection: "row",
    alignItems: "center",
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
  },
  forgotPasswordButton: {
    marginTop: 10,
    alignItems: "flex-start",
    minWidth: "100%",
  },

  forgotPasswordText: {
    fontWeight: "700",
    color: "#f00",
    alignSelf: "flex-start",
  },
  agreementText: {
    color: "gray",
    alignSelf: "center",
    fontWeight: "400",
    marginTop: 20,
    minWidth: "100%",
  },
  linkText: {
    color: "#0079ff",
    fontWeight: "700",
  },
  loginButton: {
    backgroundColor: "#00e5e5",
    height: 40,
    width: screenWidth - 40,
    borderRadius: 35,
    marginTop: 20,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  signup: {
    color: "gray",
  },
});

export default LoginScreen;
