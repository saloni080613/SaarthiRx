import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVoice } from '../context/VoiceContext';
import { useApp } from '../context/AppContext';
import { parseFuzzyCommand } from '../utils/fuzzyCommands';

const VoiceNavigation = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { transcript, isListening, speak } = useVoice();
    const { currentPageContent } = useApp();

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
                        speak('Going to dashboard');
                        break;

                    case 'SCAN':
                        navigate('/prescription/1');
                        speak('Opening prescription');
                        break;

                    case 'MEDICINES':
                        speak('Showing your medicines');
                        break;

                    case 'REMINDERS':
                        navigate('/reminder');
                        speak('Opening reminders');
                        break;

                    case 'REPEAT':
                        if (currentPageContent) {
                            speak(currentPageContent);
                        }
                        break;

                    case 'HELP':
                        speak('You can say: Home, Scan, Repeat, or Medicines');
                        break;

                    default:
                        // Unknown command - show suggestion
                        if (confidence > 0.3 && confidence <= 0.5) {
                            speak("I didn't quite understand. Try saying Home or Scan");
                        }
                        break;
                }
            }
        }
    }, [transcript, navigate, speak, currentPageContent, location.pathname]);

    return (
        <>
            {children}

            {/* Global Voice Indicator - Commented out as per user request
            {isListening && location.pathname !== '/register' && (
                <div className="fixed top-8 right-8 z-50">
                    <div className="bg-primary text-white px-8 py-4 rounded-full shadow-2xl flex items-center space-x-4 animate-pulse">
                        <div className="w-4 h-4 bg-white rounded-full animate-ping"></div>
                        <span className="text-2xl font-semibold">Listening...</span>
                    </div>
                </div>
            )}
            */}
        </>
    );
};

export default VoiceNavigation;
