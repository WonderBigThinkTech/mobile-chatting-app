import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Text, Image, Modal } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { GiftedChat, Bubble, Send, InputToolbar } from 'react-native-gifted-chat';
import { auth, db } from '../configs/firebase_configurations';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { colors } from '../configs/Colors';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import uuid from 'react-native-uuid';
import { Video, Audio } from 'expo-av';

function ChatScreen({ route }) {
    const navigation = useNavigation();
    const [messages, setMessages] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [modal, setModal] = useState(false);
    const [recording, setRecording] = useState(false);
    const [audioFileUri, setAudioFileUri] = useState(null);
    const [sound, setSound] = useState();
    const [playingAudioId, setPlayingAudioId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);


    useEffect(() => {
        const chatRef = doc(db, 'chats', route.params.id);
        const unsubscribe = onSnapshot(chatRef, (doc) => {
            if (doc.exists()) {
                const newMessages = doc.data().messages.map((message) => ({
                    ...message,
                    createdAt: message.createdAt.toDate(),
                    image: message.image ?? '',
                    video: message.video ?? '',
                    audio: message.audio ?? '', // Add audio
                }));

                setMessages((prevMessages) => {
                    const prevMessagesIds = prevMessages.map((msg) => msg._id);
                    const newMessagesIds = newMessages.map((msg) => msg._id);

                    if (JSON.stringify(prevMessagesIds) !== JSON.stringify(newMessagesIds)) {
                        return newMessages.reverse();
                    }
                    return prevMessages;
                });

                // Handle typing status
                const chatData = doc.data();
                const typingUsers = chatData.typing || {};
                setIsTyping(Object.values(typingUsers).some((isTyping) => isTyping));
            }
        });

        return () => unsubscribe();
    }, [route.params.id]);

    const handleTyping = (isTyping) => {
        const chatRef = doc(db, 'chats', route.params.id);
        updateDoc(chatRef, {
            typing: {
                [auth.currentUser.email]: isTyping,
            },
        });
    };

    const onInputTextChanged = (text) => {
        handleTyping(text.length > 0);
    };

    const onSend = useCallback((m = []) => {
        const messagesWillSend = [{ ...m[0], sent: true, received: false }];
        const chatRef = doc(db, 'chats', route.params.id);
        updateDoc(chatRef, {
            messages: arrayUnion(...messagesWillSend),
            lastUpdated: Date.now(),
        });
    }, [route.params.id]);


    const pickMedia = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            const fileType = result.assets[0].type;
            await uploadMediaAsync(result.assets[0].uri, fileType);
        }
    };

    const startRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to access audio recording is required!');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            setRecording(recording);
        } catch (error) {
            console.error('Error starting recording:', error);
        }
    };

    const stopRecording = async () => {
        try {
            setRecording(undefined);
            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
            const uri = recording.getURI();
            uploadMediaAsync(uri, 'audio');
        } catch (error) {
            console.error('Error stopping recording:', error);
        }
    };

    const playVoice = async (audioUri, messageId) => {
        if (!audioUri) {
            console.error('Audio path is null or undefined.');
            return;
        }

        try {
            if (sound) {
                await sound.unloadAsync();
                setPlayingAudioId("");
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioUri },
                { shouldPlay: true }
            );
            setSound(newSound);
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isPlaying) {
                    setPlayingAudioId(messageId);
                }
                if (status.didJustFinish) {
                    setPlayingAudioId("");
                }
            });
            await newSound.playAsync();
        } catch (error) {
            console.error('Error loading or playing sound:', error);
        }
    };

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
                setPlayingAudioId("");
            }
        };
    }, [sound]);

    const uploadMediaAsync = async (uri, type) => {
        const blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = () => resolve(xhr.response);
            xhr.onerror = () => reject(new TypeError("Network request failed"));
            xhr.responseType = "blob";
            xhr.open("GET", uri, true);
            xhr.send(null);
        });

        const randomString = uuid.v4();
        const fileRef = ref(getStorage(), `uploadMedia/${type}s/${randomString}`, randomString);
        await uploadBytes(fileRef, blob);
        blob.close();

        const uploadedFileString = await getDownloadURL(fileRef);

        const messageData = type === 'video' ? { video: uploadedFileString }
            : type === 'audio' ? { audio: uploadedFileString }
                : { image: uploadedFileString };

        onSend([{
            _id: randomString,
            createdAt: new Date(),
            text: '',
            ...messageData,
            user: {
                _id: auth?.currentUser?.email,
                name: auth?.currentUser?.displayName,
                avatar: 'https://i.pravatar.cc/300',
            },
        }]);
    };

    const renderBubble = useMemo(() => (props) => (
        <Bubble
            {...props}
            wrapperStyle={{
                right: { backgroundColor: colors.primary },
                left: { backgroundColor: 'lightgrey' },
            }}
        />
    ), []);

    const renderSend = useMemo(() => (props) => (
        <>
            <TouchableOpacity style={styles.addMediaIcon} onPress={pickMedia}>
                <View>
                    <Ionicons name='add' size={32} color={colors.teal} />
                </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addMediaIcon} onPress={recording ? stopRecording : startRecording}>
                <View>
                    <Ionicons name={recording ? 'stop' : 'mic'} size={32} color={colors.teal} />
                </View>
            </TouchableOpacity>
            <Send {...props}>
                <View style={{ justifyContent: 'center', height: '100%', marginLeft: 8, marginRight: 4, marginTop: 12 }}>
                    <Ionicons name='send' size={24} color={colors.teal} />
                </View>
            </Send>
        </>
    ), [recording]);

    const renderInputToolbar = useMemo(() => (props) => (
        <InputToolbar {...props} containerStyle={styles.inputToolbar} renderActions={renderActions} />
    ), []);

    const renderActions = useMemo(() => () => (
        <TouchableOpacity style={styles.emojiIcon} onPress={handleEmojiPanel}>
            <View>
                <Ionicons name='happy-outline' size={32} color={colors.teal} />
            </View>
        </TouchableOpacity>
    ), [modal]);

    const handleEmojiPanel = useCallback(() => {
        setModal(prevModal => !prevModal);
    }, []);

    const renderLoading = useMemo(() => () => (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={colors.teal} />
        </View>
    ), []);

    const renderMessageVideo = (props) => {
        const { currentMessage } = props;
        return (
            <View style={{ padding: 10 }}>
                <Video
                    source={{ uri: currentMessage.video }}
                    style={{ width: 300, height: 200 }}
                    useNativeControls
                    resizeMode="contain"
                    isLooping
                />
            </View>
        );
    };

    const renderMessageAudio = (props) => {
        const { currentMessage } = props;
        return (
            <View style={{ padding: 10 }}>
                <TouchableOpacity onPress={() =>
                    playVoice(currentMessage.audio, currentMessage._id)
                }>
                    <Ionicons name={playingAudioId === currentMessage._id ? 'pause' : 'play'} size={32} color={colors.teal} />
                </TouchableOpacity>
            </View>
        );
    };

    // Toggle modal visibility and set the selected image URL
    const toggleModal = (imageUri) => {
        setSelectedImage(imageUri);
        setModalVisible(!isModalVisible);
    };

    // Custom rendering for message images to make them tappable
    const renderMessageImage = (props) => {
        const { currentMessage } = props;
        return (
            <TouchableOpacity onPress={() => toggleModal(currentMessage.image)}>
                <Image
                    source={{ uri: currentMessage.image }}
                    style={styles.messageImage}
                />
            </TouchableOpacity>
        );
    };


    return (
        <View style={{ flex: 1 }}>
            <GiftedChat
                messages={messages}
                onSend={onSend}
                user={{ _id: auth.currentUser?.email }}
                renderBubble={renderBubble}
                renderSend={renderSend}
                renderMessageImage={renderMessageImage}
                // renderInputToolbar={renderInputToolbar}
                // renderActions={renderActions}
                renderMessageVideo={renderMessageVideo}
                renderMessageAudio={renderMessageAudio}
                renderLoading={renderLoading}
                renderAvatar={() => (
                    <TouchableOpacity style={styles.avatar}>
                        <View>
                            {auth.currentUser?.photoURL ? <Image
                                source={{ uri: auth.currentUser?.photoURL }}
                                style={styles.imageAvatar}
                            /> :
                                <Text style={styles.avatarLabel}>
                                    {auth.currentUser?.displayName.split(' ').reduce((prev, current) => `${prev}${current[0]}`, '')}
                                </Text>
                            }
                        </View>
                    </TouchableOpacity>

                )}
                isTyping={isTyping}
                onInputTextChanged={onInputTextChanged} // Add this line
            />
            {/* Modal for full-screen image */}
            <Modal visible={isModalVisible} transparent={true} animationType="slide">
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setModalVisible(false)}
                    >
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                    <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} />
                </View>
            </Modal>
            {/* {modal && (
                <EmojiModal
                    onClose={() => setModal(false)}
                    onSelect={(emoji) => {
                        const message = {
                            _id: uuid.v4(),
                            text: emoji,
                            createdAt: new Date(),
                            user: {
                                _id: auth.currentUser?.email,
                                name: auth.currentUser?.displayName,
                                avatar: 'https://i.pravatar.cc/300',
                            },
                        };
                        onSend([message]);
                        setModal(false);
                    }}
                />
            )} */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    inputToolbar: {
        borderTopWidth: 1,
        borderTopColor: 'lightgrey',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    addMediaIcon: {
        marginHorizontal: 8,
        marginVertical: 8,
    },
    emojiIcon: {
        marginHorizontal: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: 35,
        height: 35,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary
    },
    avatarLabel: {
        color: 'white'
    },

    messageImage: {
        width: 150,
        height: 100,
        borderRadius: 10,
        resizeMode: 'cover',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    closeButton: {
        position: 'absolute',
        top: 30,
        right: 20,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 5,
    },
    closeButtonText: {
        fontSize: 18,
        color: 'black',
    },
});

export default ChatScreen;
