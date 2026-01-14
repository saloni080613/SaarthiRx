import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useVoiceButler } from '../context/VoiceButlerContext';
import { useVoice } from '../context/VoiceContext';
import { triggerSuccess, triggerAlert } from '../utils/haptics';
import { validateIndianPhone } from '../utils/phoneValidation';
import { parseSpokenPhone } from '../utils/numberParser';
import GlobalActionButton from '../components/GlobalActionButton';

const Login = () => {
    const navigate = useNavigate();
    const { language, saveUser } = useApp();
    const { announcePageAndAction, announce } = useVoiceButler();
    const { transcript, isListening, resetTranscript } = useVoice();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    const [loginMethod, setLoginMethod] = useState(''); // 'phone' or 'google'

    const messages = {
        'en-US': {
            title: 'Welcome Back',
            subtitle: 'Login to Continue',
            phoneLogin: 'Login with Phone Number',
            googleLogin: 'Login with Google',
            phonePlaceholder: 'Enter your phone number',
            loginButton: 'Login',
            speakNumber: 'Please say your 10-digit phone number'
        },
        'hi-IN': {
            title: 'वापस स्वागत है',
            subtitle: 'जारी रखने के लिए लॉगिन करें',
            phoneLogin: 'फ़ोन नंबर से लॉगिन करें',
            googleLogin: 'गूगल से लॉगिन करें',
            phonePlaceholder: 'अपना फोन नंबर दर्ज करें',
            loginButton: 'लॉगिन',
            speakNumber: 'कृपया अपना 10 अंकों का फोन नंबर बोलें'
        },
        'mr-IN': {
            title: 'परत स्वागत आहे',
            subtitle: 'सुरू ठेवण्यासाठी लॉगिन करा',
            phoneLogin: 'फोन नंबरसह लॉगिन करा',
            googleLogin: 'गूगलसह लॉगिन करा',
            phonePlaceholder: 'तुमचा फोन नंबर प्रविष्ट करा',
            loginButton: 'लॉगिन',
            speakNumber: 'कृपया तुमचा 10 अंकी फोन नंबर सांगा'
        }
    };

    const msg = messages[language] || messages['hi-IN'];

    useEffect(() => {
        announcePageAndAction('लॉगिन', 'अपना फोन नंबर बोलें या गूगल से लॉगिन करें', false);
    }, []);

    // Auto-fill phone number from voice
    useEffect(() => {
        if (transcript && loginMethod === 'phone') {
            const parsedPhone = parseSpokenPhone(transcript, language);
            setPhoneNumber(parsedPhone);
            resetTranscript();

            // Auto-login after 2 seconds
            setTimeout(() => {
                if (parsedPhone) {
                    handlePhoneLogin();
                }
            }, 2000);
        }
    }, [transcript, loginMethod]);

    const handlePhoneLogin = () => {
        const validation = validateIndianPhone(phoneNumber);

        if (!validation.isValid) {
            triggerAlert();
            setError(validation.error);
            const errorMsg = {
                'en-US': 'Invalid phone number. Please try again.',
                'hi-IN': 'अमान्य फ़ोन नंबर। कृपया पुनः प्रयास करें।',
                'mr-IN': 'अवैध फोन नंबर. कृपया पुन्हा प्रयत्न करा.'
            };
            announce(errorMsg[language] || errorMsg['hi-IN']);
            return;
        }

        // Check if user exists
        const savedUser = localStorage.getItem('saarthi_user');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            if (userData.phone === validation.formatted) {
                triggerSuccess();
                saveUser(userData);
                navigate('/dashboard');
            } else {
                triggerAlert();
                setError('Phone number not registered');
                announce('यह फ़ोन नंबर पंजीकृत नहीं है');
            }
        } else {
            triggerAlert();
            setError('No user found. Please register first.');
            announce('कोई उपयोगकर्ता नहीं मिला। कृपया पहले पंजीकरण करें।');
        }
    };

    const handleGoogleLogin = () => {
        // Placeholder for Google OAuth
        announce('गूगल लॉगिन जल्द ही आ रहा है');
        console.log('Google login - To be implemented');
    };

    return (
        <motion.div
            className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 pb-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Logo */}
            <motion.img
                src="/logo.png"
                alt="SaarthiRx"
                className="w-24 h-24 sm:w-28 sm:h-28 mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
            />

            {/* Title */}
            <motion.h1
                className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2 text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                {msg.title}
            </motion.h1>
            <motion.p
                className="text-base sm:text-lg text-gray-600 mb-8 text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                {msg.subtitle}
            </motion.p>

            {/* Login Options */}
            <div className="w-full max-w-sm space-y-4">
                {!loginMethod ? (
                    <>
                        {/* Phone Login Button */}
                        <motion.button
                            onClick={() => setLoginMethod('phone')}
                            className="w-full p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 text-white font-semibold text-lg shadow-premium flex items-center justify-center space-x-3"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            <span>{msg.phoneLogin}</span>
                        </motion.button>

                        {/* Google Login Button */}
                        <motion.button
                            onClick={handleGoogleLogin}
                            className="w-full p-4 rounded-2xl bg-white border-2 border-gray-300 text-gray-800 font-semibold text-lg shadow-md flex items-center justify-center space-x-3"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>{msg.googleLogin}</span>
                        </motion.button>
                    </>
                ) : (
                    /* Phone Number Input */
                    <motion.div
                        className="space-y-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="bg-white p-6 rounded-2xl shadow-premium">
                            <p className="text-sm text-gray-600 mb-3 text-center">{msg.speakNumber}</p>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder={msg.phonePlaceholder}
                                className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none text-center"
                                maxLength={10}
                            />
                            {error && (
                                <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
                            )}
                        </div>

                        <button
                            onClick={handlePhoneLogin}
                            className="w-full p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 text-white font-semibold text-lg shadow-premium"
                        >
                            {msg.loginButton}
                        </button>

                        <button
                            onClick={() => {
                                setLoginMethod('');
                                setPhoneNumber('');
                                setError('');
                            }}
                            className="w-full p-3 text-gray-600 underline"
                        >
                            ← Back
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Listening Indicator */}
            {isListening && loginMethod === 'phone' && (
                <motion.div
                    className="fixed top-20 inset-x-0 mx-auto w-max z-50 px-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="bg-primary text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg">
                        🎙️ {msg.speakNumber}
                    </div>
                </motion.div>
            )}

            <GlobalActionButton isActive={isListening} />
        </motion.div>
    );
};

export default Login;
