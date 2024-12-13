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
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import {
  MaterialCommunityIcons,
  MaterialIcons,
  Ionicons,
} from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  firebase,
  auth,
  createUserWithEmailAndPassword,
  db,
  storage,
} from "../configs/firebase_configurations";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert from "../components/CustomAlert";
import Loader from "../components/Loader";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, doc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { CommonActions } from "@react-navigation/native";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const SignUpScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const emailRef = useRef();
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();

  const selectProfilePicture = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setProfilePic(result.assets[0].uri);
      }
    } catch (error) {
      showAlert("Error", "Failed to pick image.");
    }
  };

  const handleRegistration = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      showAlert("Error", "Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Attempt to create a new user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
 
      // Handle cases where user creation is successful but no currentUser
      if (!currentUser) {
        throw new Error("User creation failed. Please try again.");
      }

      const userId = currentUser.uid;
      if (profilePic) {
        await uploadProfilePicture().then(async (value) => {
          // Save user data to Firestore
          await saveUserData(userId, value);

          // Update User Details
          await updateUserProfile(fullName, value);

          // Navigate to the main screen
          await navigateToMainScreen(userId, value);

        }).catch(async (error) => {
          // Navigate to the main screen
          await navigateToMainScreen(userId, "");
        });
      } else {
        // Save user data to Firestore
        await saveUserData(userId, null);

        // Update User Details
        await updateUserProfile(fullName, null);

        // Navigate to the main screen
        await navigateToMainScreen(userId, "");

      }
    } catch (error) {
      // Handle Firebase authentication errors
      if (error.code === 'auth/email-already-in-use') {
        showAlert("Error", "The email address is already in use by another account.");
      } else if (error.code === 'auth/invalid-email') {
        showAlert("Error", "The email address is not valid.");
      } else if (error.code === 'auth/weak-password') {
        showAlert("Error", "The password is too weak. Please choose a stronger password.");
      } else if (error.code === 'auth/operation-not-allowed') {
        showAlert("Error", "This operation is not allowed. Please contact support.");
      } else if (error.code === 'auth/user-not-found') {
        showAlert("Error", "No user record found.");
      } else {
        // Handle general errors
        showAlert("Error", error.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };


  const uploadProfilePicture = async () => {
    let profilePicURI = profilePic || require("../assets/blank-profile-picture-973460_1280.png").uri;

    try {
      const currentUser = auth.currentUser;
      const userId = currentUser.uid;
      const response = await fetch(profilePicURI);
      const blob = await response.blob();
      const profilePicName = profilePicURI.substring(profilePicURI.lastIndexOf("/") + 1);
      const storageRef = ref(storage, `user_files/${userId}/profilePictures/${profilePicName}`);

      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);

      return downloadURL;
    } catch (error) {
      showAlert("Error", "Failed to upload profile picture.");
      throw error;
    }
  };

  const saveUserData = async (userId, profilePicURL) => {
    const joined = `${new Date().getMonth() + 1}-${new Date().getFullYear()}`;
    try {
      // Store User Details
      await setDoc(doc(collection(db, "users"), userId), {
        userId,
        email,
        fullName,
        profilePicUrl: profilePicURL,
        joined,
      });
    } catch (error) {
      showAlert("Error", "Failed to save user data.");
      throw error;
    }
  };

  const updateUserProfile = async (fullName, profilePicURL) => {
    const currentUser = auth.currentUser;

    if (currentUser) {
      try {
        await updateProfile(currentUser, {
          displayName: fullName,
          photoURL: profilePicURL,
        });

        // Reload user data to ensure it reflects the latest updates
        await currentUser.reload();

        // Optionally, you can re-fetch the user data
        const updatedUser = auth.currentUser;
        return updatedUser;
      } catch (error) {
        console.error("Error updating profile:", error);
      }
    }
  };


  const navigateToMainScreen = async (userId, profilePicURL) => {
    await AsyncStorage.setItem("FULLNAME", fullName);
    await AsyncStorage.setItem("EMAIL", email);
    await AsyncStorage.setItem("USERID", userId);
    await AsyncStorage.setItem("PROFILEPICURL", profilePicURL);

    navigation.dispatch(
      CommonActions.reset({
        index: 0, // The index of the new screen to make active
        routes: [{
          name: 'home', params: {
            fullname: fullName || null,
            email: email,
            userId: userId,
            profileURL: profilePicURL || null,
          }
        }],
      })
    );
  };

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const closeAlert = () => setAlertVisible(false);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.profileView}>
        <TouchableOpacity style={styles.profilePicContainer} onPress={selectProfilePicture}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.profilePic} />
          ) : (
            <View style={styles.placeholderPic}>
              <Ionicons name="camera" size={30} color={"#00e5e5"} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.textLabel}>Full Name</Text>
      <TextInput
        placeholder="Your name"
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current.focus()}
      />

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
          style={styles.passwordInput}
          placeholder="Password"
          value={password}
          autoCapitalize="none"
          onChangeText={setPassword}
          secureTextEntry={!passwordVisible}
          returnKeyType="next"
          onSubmitEditing={() => confirmPasswordRef.current.focus()}
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

      <Text style={styles.textLabel}>Confirm Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          ref={confirmPasswordRef}
          style={styles.passwordInput}
          placeholder="Confirm Password"
          value={confirmPassword}
          autoCapitalize="none"
          onChangeText={setConfirmPassword}
          secureTextEntry={!confirmPasswordVisible}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
        >
          <MaterialIcons
            name={confirmPasswordVisible ? "visibility-off" : "visibility"}
            size={24}
            color="gray"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.agreementText}>
        By continuing, you agree to our{" "}
        <Text style={styles.linkText}>terms of services</Text> and{" "}
        <Text style={styles.linkText}>privacy policy</Text>.
      </Text>

      <TouchableOpacity style={styles.registerButton} onPress={handleRegistration}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace("login")}>
        <Text style={styles.alreadyHaveAnAccount}>Already have an account? Sign In</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />

      <Loader visible={loading} />
      <CustomAlert visible={alertVisible} title={alertTitle} message={alertMessage} onClose={closeAlert} />
    </ScrollView>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    alignSelf: 'center',
    padding: 8,
  },
  profileView: {
    marginTop: 40,
    marginBottom: 20,
  },
  profilePicContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderPic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  textLabel: {
    fontWeight: "600",
    fontSize: 15,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  input: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginVertical: 5
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    padding: 10,
    marginVertical: 5
  },
  passwordInput: {
    flex: 1,
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
  },
  agreementText: {
    color: "gray",
    alignSelf: "center",
    marginVertical: 15,
    fontWeight: "400",
  },
  linkText: {
    color: "#0079ff",
    fontWeight: "700",
  },
  registerButton: {
    backgroundColor: "#00e5e5",
    height: 40,
    width: screenWidth / 2,
    borderRadius: 35,
    marginVertical: 0,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  alreadyHaveAnAccount: {
    color: "gray",
    alignSelf: "center",
    fontWeight: "400",
  },
});
