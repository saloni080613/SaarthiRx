/**
 * VoiceNavigation - Global Voice Command Handler
 * Mounted at Root Level to listen on every page
 * Simple One-Word Keywords for Elder-Friendly navigation
 * + AI Medicine Addition via natural language
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVoice } from '../context/VoiceContext';
import { useApp } from '../context/AppContext';
import { parseFuzzyCommand } from '../utils/fuzzyCommands';
import { triggerAction, triggerSuccess, triggerAlert } from '../utils/haptics';
import { isMedicineAdditionCommand, addMedicineByVoice } from '../services/aiMedicineManager';

const VoiceNavigation = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { transcript, isListening, speak, resetTranscript } = useVoice();
    const { language, currentPageContent } = useApp();
    const processingRef = useRef(false);

    // Friendly navigation messages (not robotic)
    const getNavigationMessage = useCallback((destination) => {
        const messages = {
            'home': {
                'en-US': 'Taking you home',
                'hi-IN': 'घर ले जा रहा हूँ',
                'mr-IN': 'घरी नेतो आहे'
            },
            'scan': {
                'en-US': 'Opening camera',
                'hi-IN': 'कैमरा खोल रहा हूँ',
                'mr-IN': 'कॅमेरा उघडतो आहे'
            },
            'medicines': {
                'en-US': 'Showing your medicines',
                'hi-IN': 'आपकी दवाइयां दिखा रहा हूँ',
                'mr-IN': 'तुमची औषधे दाखवतो आहे'
            },
            'reminders': {
                'en-US': 'Opening reminders',
                'hi-IN': 'रिमाइंडर खोल रहा हूँ',
                'mr-IN': 'रिमाइंडर उघडतो आहे'
            },
            'back': {
                'en-US': 'Going back',
                'hi-IN': 'वापस जा रहा हूँ',
                'mr-IN': 'मागे जातो आहे'
            }
        };
        return messages[destination]?.[language] || messages[destination]?.['en-US'] || 'OK';
    }, [language]);

    // Handle AI medicine addition
    const handleAIMedicineAddition = useCallback(async (input) => {
        if (processingRef.current) return;
        processingRef.current = true;

        try {
            const processingMsg = {
                'en-US': 'Adding medicine...',
                'hi-IN': 'दवाई जोड़ रहा हूँ...',
                'mr-IN': 'औषध जोडत आहे...'
            };
            speak(processingMsg[language] || processingMsg['en-US']);

            const result = await addMedicineByVoice(input, language);
            
            if (result.success) {
                triggerSuccess();
            } else {
                triggerAlert();
            }
            
            speak(result.voiceFeedback);
        } catch (error) {
            console.error('AI medicine addition error:', error);
            triggerAlert();
        } finally {
            processingRef.current = false;
        }
    }, [language, speak]);

    // Listen for voice commands globally
    useEffect(() => {
        if (!transcript || !transcript.trim()) return;

        // Don't interfere with Register page voice input
        if (location.pathname === '/register') {
            return;
        }

        // Check for AI medicine addition command first
        if (isMedicineAdditionCommand(transcript)) {
            triggerAction();
            resetTranscript?.();
            handleAIMedicineAddition(transcript);
            return;
        }

        const { action, confidence } = parseFuzzyCommand(transcript);

        // Only act on confident matches
        if (confidence > 0.5) {
            // Haptic feedback on command recognition
            triggerAction();
            
            // Clear transcript after processing
            resetTranscript?.();

            switch (action) {
                case 'HOME':
                    speak(getNavigationMessage('home'));
                    setTimeout(() => navigate('/dashboard'), 300);
                    break;

                case 'SCAN':
                    speak(getNavigationMessage('scan'));
                    setTimeout(() => navigate('/scan'), 300);
                    break;

                case 'MEDICINES':
                    speak(getNavigationMessage('medicines'));
                    setTimeout(() => navigate('/medicines'), 300);
                    break;

                case 'REMINDERS':
                    speak(getNavigationMessage('reminders'));
                    setTimeout(() => navigate('/reminders'), 300);
                    break;

                case 'BACK':
                    speak(getNavigationMessage('back'));
                    setTimeout(() => navigate(-1), 300);
                    break;

                case 'REPEAT':
                    if (currentPageContent) {
                        speak(currentPageContent);
                    } else {
                        const repeatMsg = {
                            'en-US': 'Nothing to repeat',
                            'hi-IN': 'दोहराने के लिए कुछ नहीं',
                            'mr-IN': 'पुन्हा सांगायला काही नाही'
                        };
                        speak(repeatMsg[language] || repeatMsg['en-US']);
                    }
                    break;

                case 'HELP':
                    const helpMsg = {
                        'en-US': 'You can say: Home, Scan, Medicines, Reminders, Back, or add a medicine by name',
                        'hi-IN': 'आप बोल सकते हैं: होम, स्कैन, दवाई, रिमाइंडर, वापस, या दवाई का नाम बोलकर जोड़ सकते हैं',
                        'mr-IN': 'तुम्ही बोलू शकता: होम, स्कॅन, औषध, रिमाइंडर, मागे, किंवा औषधाचे नाव सांगून जोडू शकता'
                    };
                    speak(helpMsg[language] || helpMsg['en-US']);
                    break;

                default:
                    // Unknown command - ignore silently for elder-friendliness
                    break;
            }
        }
    }, [transcript, navigate, speak, currentPageContent, location.pathname, language, getNavigationMessage, resetTranscript, handleAIMedicineAddition]);

    return (
        <>
            {children}
        </>
    );
};

export default VoiceNavigation;

