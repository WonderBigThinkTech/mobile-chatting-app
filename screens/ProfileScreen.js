import React, { Component } from "react";
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { firebase, auth, db, storage } from "../configs/firebase_configurations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons, } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from "firebase/storage";
import {
  getAuth,
  updateProfile,
  deleteUser as firebaseDeleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import Loader from "../components/Loader";
import { CommonActions } from "@react-navigation/native";


export default class ProfileScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userId: "",
      user: null,
      isEditingName: false,
      newName: "",
      loading: false,
      screenLoading: false,
      deleteLoading: false,
      profilePic: null,
      isPasswordPromptVisible: false,
      enteredPassword: "",
    };
  }

  fetchUser = async (userId) => {
    try {

      this.setState({ screenLoading: true });
      // Get a reference to the user document
      const userDocRef = doc(db, "users", userId);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        if (userData && userData.fullName) {
          this.setState({
            user: userData,
            newName: userData.fullName,
            screenLoading: false,
          });
        } else {
          this.setState({ screenLoading: false });
        }
      } else {
        this.setState({ screenLoading: false });
      }
    } catch (error) {
      this.setState({ screenLoading: false });
    }
  };

  componentDidMount = async () => {
    try {
      this.setState({ screenLoading: true });
      const userId = await AsyncStorage.getItem("USERID");
      if (userId) {
        this.setState({ userId });
        this.fetchUser(userId);
      } else {
        this.setState({ screenLoading: false });
      }
    } catch (error) {
      console.error("Error getting USERID from AsyncStorage:", error);
      this.setState({ screenLoading: false });
    }
  };

  toggleEditName = () => {
    this.setState({ isEditingName: !this.state.isEditingName });
  };

  handleNameChange = (text) => {
    this.setState({ newName: text });
  };

  saveName = async () => {
    const { userId, newName } = this.state;
    try {
      this.setState({ screenLoading: true });

      // Reference to the user's document
      const userDocRef = doc(db, "users", userId);

      // Update the fullName field
      await updateDoc(userDocRef, { fullName: newName });

      this.setState({ isEditingName: false, screenLoading: false });
      this.fetchUser(userId); // Refresh user data
    } catch (error) {
      console.error("Error updating user name:", error);
      this.setState({ screenLoading: false });
    }
  };

  selectProfilePicture = async () => {
    try {
      // Request permissions if not granted
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "You need to grant permission to access photos."
        );
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        this.uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error selecting profile picture:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  updateUserProfile = async (profilePicURL) => {
    const currentUser = auth.currentUser;

    if (currentUser) {
      try {
        await updateProfile(currentUser, {
          photoURL: profilePicURL,
        });

        // Reload user data to ensure it reflects the latest updates
        await currentUser.reload();

        // Optionally, you can re-fetch the user data
        const updatedUser = auth.currentUser;

        return updatedUser;
      } catch (error) {
        // console.error("Error updating profile:", error);
      }
    }
  };

  uploadProfilePicture = async (uri) => {

    // Set default profile picture if the user didn't select one
    let profilePicURI = this.profilePic;
    if (!this.profilePic) {
      const defaultPic = require("../assets/blank-profile-picture-973460_1280.png");
      profilePicURI = Image.resolveAssetSource(defaultPic).uri;
    }

    // Uploading profile picture to Firebase Storage
    let profilePicURL = "";
    let profilePicName = "blank-profile-picture";

    try {
      this.setState({ loading: true });

      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload image to Firebase Storage
      const userId = this.state.userId;
      profilePicName = profilePicURI.substring(
        profilePicURI.lastIndexOf("/") + 1
      );
      const storageRef = ref(storage, `user_files/${userId}/profilePictures/${profilePicName}`);
      await uploadBytes(storageRef, blob);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update User Details
      await this.updateUserProfile(downloadURL);

      // Update Firestore
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        profilePicUrl: downloadURL,
      });

      // Update local state
      this.setState((prevState) => ({
        user: { ...prevState.user, profilePicUrl: downloadURL },
        loading: false,
      }));

      await AsyncStorage.setItem("PROFILEPICURL", downloadURL);

      Alert.alert("Success", "Profile picture updated successfully.");
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      this.setState({ loading: false });
      Alert.alert("Error", "Failed to upload image. Please try again.");
    }
  };

  // Delete User
  deleteUser = async () => {
    Alert.alert(
      "Confirm Deletion",
      "If you continue, you won't be able to retrieve your data. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { userId } = this.state;
              const user = auth.currentUser;

              if (!user) {
                Alert.alert("Error", "User not logged in. Please log in again.");
                return;
              }

              // Prompt user for their current password
              this.promptUserForPassword(); // Show the modal
            } catch (error) {
              console.error("Error deleting user:", error);
              Alert.alert(
                "Error",
                "Failed to delete your account. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  // Handle password submission
  handlePasswordSubmit = async () => {
    try {
      const { enteredPassword } = this.state;
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "User not logged in. Please log in again.");
        return;
      }

      // Create credential with current email and password
      const credential = EmailAuthProvider.credential(user.email, enteredPassword);

      // Re-authenticate user
      await reauthenticateWithCredential(user, credential);

      // Proceed with deletion
      await this.deleteUserAccount();
    } catch (error) {
      console.error("Error reauthenticating user:", error);
      Alert.alert("Error", "Incorrect password. Please try again.");
    } finally {
      // Hide the modal after handling
      this.setState({ isPasswordPromptVisible: false, enteredPassword: "" });
    }
  };

  // Perform the deletion after successful reauthentication
  deleteUserAccount = async () => {
    const { userId } = this.state;
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "User not logged in. Please log in again.");
      return;
    }

    try {
      this.setState({ deleteLoading: true });

      // Get reference to Firebase Storage
      const userStorageRef = ref(storage, `user_files/${userId}/`);

      await this.deleteUserFolder(userStorageRef);

      // Delete the user's document from Firestore
      const userDocRef = doc(db, "users", userId);
      await deleteDoc(userDocRef);

      // Delete user authentication
      await firebaseDeleteUser(user);

      // Clear AsyncStorage
      await AsyncStorage.clear();

      // Navigate to the login screen
      this.props.navigation.dispatch(
        CommonActions.reset({
          index: 0, // The index of the new screen to make active
          routes: [{ name: 'login' }],
        })
      );
      // this.props.navigation.navigate("login");
      this.setState({ deleteLoading: false });
      Alert.alert("Success", "Your account has been deleted.");
    } catch (error) {
      console.error("Error deleting user account:", error);
      this.setState({ deleteLoading: false });
      Alert.alert("Error", "There was a problem deleting your account.");
    }
  };


  deleteUserFolder = async (folderRef) => {
    try {
      // List all items and prefixes in the folder
      const listResult = await listAll(folderRef);

      // Delete all items in the folder
      const deletePromises = listResult.items.map(itemRef => deleteObject(itemRef));
      await Promise.all(deletePromises);

      // Optionally, delete any subfolders recursively
      const deleteSubfoldersPromises = listResult.prefixes.map(subfolderRef => this.deleteUserFolder(subfolderRef));
      await Promise.all(deleteSubfoldersPromises);

    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };


  // Helper function to prompt user for their current password
  promptUserForPassword = () => {
    // Show the password prompt modal
    this.setState({ isPasswordPromptVisible: true });
  };

  handleCancel = () => {
    // Hide the password prompt modal
    this.setState({ isPasswordPromptVisible: false });
  }

  render() {
    const { user, isEditingName, newName, screenLoading, isPasswordPromptVisible, enteredPassword } = this.state;

    if (screenLoading) {
      return <ActivityIndicator size="large" color="#00e5e5" />;
    }

    if (!user) {
      return null; // Can add a fallback UI or retry button
    }

    return (
      <>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.profilePicContainer}
            onPress={this.selectProfilePicture}
          >
            {user.profilePicUrl ? (
              <>
                <Image
                  source={{ uri: user.profilePicUrl }}
                  style={styles.profilePic}
                />
                <View
                  style={{
                    borderRadius: 1500,
                    backgroundColor: "#ccc",
                    height: 40,
                    width: 40,
                    zIndex: 1000,
                    position: "absolute",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.8,
                    top: 80,
                    right: 0,
                  }}
                >
                  <MaterialIcons
                    name="edit"
                    size={30}
                    color={"#00e5e5"}
                  // style={{ zIndex: 1000, position: "absolute" }}
                  />
                </View>
              </>
            ) : (
              <>
                <View
                  style={{
                    borderRadius: 1500,
                    backgroundColor: "#ccc",
                    height: 120,
                    width: 120,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      borderRadius: 1500,
                      backgroundColor: "#eee",
                      height: 40,
                      width: 40,
                      zIndex: 1000,
                      position: "absolute",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.8,
                      top: 80,
                      right: 0,
                    }}
                  >
                    <Ionicons name="camera" size={30} color={"#00e5e5"} />
                  </View>
                </View>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            {isEditingName ? (
              <View style={styles.editNameContainer}>
                <TextInput
                  style={styles.nameInput}
                  value={newName}
                  onChangeText={this.handleNameChange}
                />
                <TouchableOpacity
                  onPress={this.saveName}
                  style={styles.saveButton}
                >
                  <Ionicons name="save" size={20} color={"#fff"} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={this.toggleEditName}>
                <Text style={styles.name}>{user.fullName}</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.email}>{user.email}</Text>
            <TouchableOpacity style={styles.deleteButton} onPress={this.deleteUser}>
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
          {/* Password Prompt Modal */}
          {isPasswordPromptVisible && (
            <View style={styles.modalOverlay}>
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>Re-authenticate</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter your password"
                  value={enteredPassword}
                  onChangeText={(text) => this.setState({ enteredPassword: text })}
                />
                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity
                    style={styles.modalSubmitButton}
                    onPress={this.handlePasswordSubmit}
                  >
                    <Text style={styles.modalButtonText}>Submit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={this.handleCancel}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          <Loader visible={this.state.loading} />
        </View>
        <Loader visible={this.state.deleteLoading} />
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  profilePicContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  profilePic: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderColor: "#00e5e5",
    borderWidth: 2,
  },
  editIconContainer: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  infoContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
  },
  email: {
    fontSize: 18,
    color: "gray",
  },
  editNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameInput: {
    borderBottomWidth: 1,
    borderColor: "#00e5e5",
    fontSize: 20,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: "#00e5e5",
    padding: 5,
    borderRadius: 5,
  },
  deleteButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "red",
    borderRadius: 5,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  modalSubmitButton: {
    backgroundColor: 'red',
    padding: 10,
    marginEnd: 10,
    borderRadius: 5,
  },
  modalCancelButton: {
    backgroundColor: 'grey',
    padding: 10,
    borderRadius: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

});


