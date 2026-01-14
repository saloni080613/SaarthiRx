import { 
    RecaptchaVerifier, 
    signInWithPhoneNumber, 
    signOut 
} from 'firebase/auth';
import { auth } from '../firebase/firebase';

// Store confirmation result globally for OTP verification
let confirmationResult = null;

/**
 * Setup invisible reCAPTCHA verifier
 * @param {string} containerId - ID of the container element for reCAPTCHA
 * @returns {RecaptchaVerifier} The reCAPTCHA verifier instance
 */
export const setupRecaptcha = (containerId) => {
    // Clear any existing reCAPTCHA
    if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
            // reCAPTCHA solved - will proceed with phone auth
            console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
            // Response expired - reset reCAPTCHA
            console.log('reCAPTCHA expired');
        }
    });

    return window.recaptchaVerifier;
};

/**
 * Send OTP to phone number
 * @param {string} phoneNumber - Phone number with country code (e.g., +919876543210)
 * @returns {Promise<boolean>} True if OTP sent successfully
 */
export const sendOtp = async (phoneNumber) => {
    try {
        const appVerifier = window.recaptchaVerifier;
        
        if (!appVerifier) {
            throw new Error('reCAPTCHA not initialized');
        }

        // Format phone number with India country code if not present
        const formattedPhone = phoneNumber.startsWith('+') 
            ? phoneNumber 
            : `+91${phoneNumber}`;

        confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        
        return true;
    } catch (error) {
        console.error('Error sending OTP:', error);
        
        // Reset reCAPTCHA on error
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
        }
        
        throw error;
    }
};

/**
 * Verify OTP and sign in user
 * @param {string} otp - 6-digit OTP entered by user
 * @returns {Promise<object>} Firebase user object
 */
export const verifyOtp = async (otp) => {
    try {
        if (!confirmationResult) {
            throw new Error('OTP not sent yet. Please request OTP first.');
        }

        const result = await confirmationResult.confirm(otp);
        confirmationResult = null; // Clear after successful verification
        
        return result.user;
    } catch (error) {
        console.error('Error verifying OTP:', error);
        throw error;
    }
};

/**
 * Get current authenticated user
 * @returns {object|null} Current user or null
 */
export const getCurrentUser = () => {
    return auth.currentUser;
};

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export const signOutUser = async () => {
    try {
        await signOut(auth);
        confirmationResult = null;
        
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
        }
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
};

/**
 * Get user-friendly error message
 * @param {Error} error - Firebase error
 * @param {string} language - Current language code
 * @returns {string} User-friendly error message
 */
export const getAuthErrorMessage = (error, language = 'hi-IN') => {
    const errorMessages = {
        'auth/invalid-phone-number': {
            'en-US': 'Invalid phone number. Please check and try again.',
            'hi-IN': 'अमान्य फ़ोन नंबर। कृपया जाँचें और पुनः प्रयास करें।',
            'mr-IN': 'अवैध फोन नंबर. कृपया तपासा आणि पुन्हा प्रयत्न करा.'
        },
        'auth/invalid-verification-code': {
            'en-US': 'Wrong OTP. Please try again.',
            'hi-IN': 'गलत OTP। कृपया पुनः प्रयास करें।',
            'mr-IN': 'चुकीचा OTP. कृपया पुन्हा प्रयत्न करा.'
        },
        'auth/code-expired': {
            'en-US': 'OTP expired. Please request a new one.',
            'hi-IN': 'OTP समाप्त हो गया। कृपया नया OTP मांगें।',
            'mr-IN': 'OTP कालबाह्य झाला. कृपया नवीन OTP मागवा.'
        },
        'auth/too-many-requests': {
            'en-US': 'Too many attempts. Please try again later.',
            'hi-IN': 'बहुत अधिक प्रयास। कृपया बाद में पुनः प्रयास करें।',
            'mr-IN': 'खूप प्रयत्न. कृपया नंतर पुन्हा प्रयत्न करा.'
        },
        'default': {
            'en-US': 'Something went wrong. Please try again.',
            'hi-IN': 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।',
            'mr-IN': 'काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.'
        }
    };

    const errorCode = error.code || 'default';
    const messages = errorMessages[errorCode] || errorMessages['default'];
    
    return messages[language] || messages['hi-IN'];
};
