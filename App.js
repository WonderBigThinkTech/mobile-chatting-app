import { CommonActions, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { auth } from './configs/firebase_configurations';
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import ForgetPasswordScreen from './screens/ForgetPasswordScreen';
import SplashScreen from './screens/SplashScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChatScreen from './screens/ChatScreen';
import ChatUsersScreen from './screens/ChatUsersScreen';
import ChatHeader from './components/ChatHeader';
import GroupUsersScreen from './screens/GroupUsersScreen';
import ChatInfo from './screens/ChatInfo';
import GroupInfo from './screens/GroupInfo';
import GroupChatHeader from './components/GroupChatHeader';
import GroupChatScreen from './screens/GroupChatScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();

// Handle Log Out BTN
const handleLogout = async (navigation) => {
  try {
    // Sign out from Firebase
    await auth.signOut();

    // Remove User data from AsyncStorage
    await AsyncStorage.removeItem("FULLNAME");
    await AsyncStorage.removeItem("USERID");
    await AsyncStorage.removeItem("EMAIL");
    await AsyncStorage.removeItem("PROFILEPICURL");

    // Navigate to the login screen
    navigation.dispatch(
      CommonActions.reset({
        index: 0, // The index of the new screen to make active
        routes: [{ name: 'login' }],
      })
    );
  } catch (error) {
    Alert.alert(
      "Error",
      "Failed to log out. Please try again.",
      [
        {
          text: "OK",
          onPress: () => {
            // Navigate to the login screen
            navigation.dispatch(
              CommonActions.reset({
                index: 0, // The index of the new screen to make active
                routes: [{ name: 'login' }],
              })
            );
          },
        },
      ]
    );
  }
};

export default function App() {
  return (
    <GestureHandlerRootView>
      <NavigationContainer independent={true}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: "#00e5e5",
            },
            headerTitleStyle: {
              color: "#fff",
              textAlign: "center",
              fontSize: 24,
            },
            headerTitleAllowFontScaling: true,
            headerTitleAlign: "center",
            headerTintColor: "#fff",
          }}
          initialRouteName="splash"
        >
          <Stack.Screen
            name="splash"
            component={SplashScreen}
            options={{
              headerShown: false,
              headerStyle: {
                backgroundColor: "#fff",
                borderBottomWidth: 0,
                elevation: 0,
              },
            }}
          />
          <Stack.Screen
            name="login"
            component={LoginScreen}
            options={{
              headerShown: false,
              headerStyle: {
                backgroundColor: "#fff",
                borderBottomWidth: 0,
                elevation: 0,
              },
            }}
          />
          <Stack.Screen
            name="signup"
            component={SignUpScreen}
            options={{
              headerShown: false,
              headerStyle: {
                backgroundColor: "#fff",
                borderBottomWidth: 0,
                elevation: 0,
              },
              headerTitleStyle: {
                color: "#00e5e5",
                fontWeight: "bold",
                textAlign: "center",
                fontSize: 20,
              },
              headerTitle: "Sign Up",
              headerTitleAllowFontScaling: true,
              headerTitleAlign: "center",
              headerTintColor: "#00e5e5",
            }}
          />
          <Stack.Screen
            name="Forgot"
            component={ForgetPasswordScreen}
            options={{
              headerShown: false,
              headerStyle: {
                backgroundColor: "#fff",
                borderBottomWidth: 0,
                elevation: 0,
              },
              headerTitleStyle: {
                color: "#00e5e5",
                fontWeight: "bold",
                textAlign: "center",
                fontSize: 20,
              },
              headerTitle: "Forgot your password?",
              headerTitleAllowFontScaling: true,
              headerTitleAlign: "center",
              headerTintColor: "#00e5e5",
            }}
          />
          <Stack.Screen
            name="home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ route }) => ({
              headerTitle: () =>
                <ChatHeader
                  chatImage={route.params.chatImage}
                  chatName={route.params.chatName}
                  chatId={route.params.id}
                />
            })}
          />
          <Stack.Screen
            name="GroupChat"
            component={GroupChatScreen}
            options={({ route }) => ({
              headerTitle: () =>
                <GroupChatHeader
                  chatImage={route.params.chatImage}
                  chatName={route.params.chatName}
                  chatId={route.params.id}
                />
            })}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={({ navigation }) => ({
              headerStyle: {
                backgroundColor: "#00e5e5",
                borderBottomWidth: 0,
                elevation: 0,
              },
              headerTitleStyle: {
                color: "#fff",
                fontWeight: "bold",
                textAlign: "center",
                fontSize: 20,
              },
              headerTitle: "Profile",
              headerTitleAllowFontScaling: true,
              headerTitleAlign: "center",
              headerTintColor: "#fff",
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => handleLogout(navigation)}
                >
                  <Ionicons
                    name="log-out"
                    size={24}
                    color="white"
                    style={{ marginRight: 10 }}
                  />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen name="ChatUsers" component={ChatUsersScreen} options={{ title: 'Select User' }} />
          <Stack.Screen name="GroupUsers" component={GroupUsersScreen} options={{ title: 'Select Users For Group' }} />
          <Stack.Screen name="ChatInfo" component={ChatInfo} options={{ title: 'Chat Information' }} />
          <Stack.Screen name="GroupInfo" component={GroupInfo} options={{ title: 'Group Information' }} />

        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </GestureHandlerRootView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
