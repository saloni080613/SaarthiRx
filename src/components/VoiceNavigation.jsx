import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVoice } from '../context/VoiceContext';
import { useApp } from '../context/AppContext';
import { parseFuzzyCommand } from '../utils/fuzzyCommands';
import { getPrompt } from '../utils/translations';

const VoiceNavigation = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { transcript, isListening, speak } = useVoice();
    const { language, currentPageContent } = useApp();

    // Listen for voice commands globally
    useEffect(() => {
        if (transcript && transcript.trim()) {
            // Don't interfere with Register page voice input
            if (location.pathname === '/register') {
                return;
            }

            const { action, confidence } = parseFuzzyCommand(transcript);

            // Only act on high confidence matches
            if (confidence > 0.5) {
                switch (action) {
                    case 'HOME':
                        navigate('/dashboard');
                        speak(getPrompt('HOME', language));
                        break;

                    case 'SCAN':
                        navigate('/prescription/1');
                        speak(getPrompt('SCAN', language));
                        break;

                    case 'MEDICINES':
                        speak(getPrompt('MEDICINES', language));
                        break;

                    case 'REMINDERS':
                        navigate('/reminders');
                        speak(getPrompt('REMINDERS', language));
                        break;

                    case 'REPEAT':
                        if (currentPageContent) {
                            speak(currentPageContent);
                        } else {
                            speak(getPrompt('REPEAT', language));
                        }
                        break;

                    case 'HELP':
                        speak(getPrompt('HELP', language));
                        break;

                    default:
                        // Unknown command - show suggestion
                        if (confidence > 0.3 && confidence <= 0.5) {
                            // Assuming we want a generic "didn't understand" prompt
                            // For now using specific english fallback logic if not in dictionary
                            // Or we can add UNKNOWN_COMMAND to dictionary
                            // Just leaving original logic but localised if possible?
                            // No, user requirement: "If language === 'hi', the app is forbidden from using English synthesis."
                            // So I should simple ignore or use a generic "Sorry" prompt
                            // speak(getPrompt('ERR_GENERIC', language));
                        }
                        break;
                }
            }
        }
    }, [transcript, navigate, speak, currentPageContent, location.pathname, language]);

    return (
        <>
            {children}
        </>
    );
};

export default VoiceNavigation;
