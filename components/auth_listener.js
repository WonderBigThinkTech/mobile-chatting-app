import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth'; // Import the onAuthStateChanged function
import { auth } from '../configs/firebase_configurations'; // Import the auth instance from your config.js

const AuthListener = () => {
    useEffect(() => {
        // Listen for authentication state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is logged in, get the UID
            } else {
                // User is logged out
            }
        });

        // Clean up the listener when the component unmounts
        return () => unsubscribe();
    }, []);

    return null;
};

export default AuthListener;
