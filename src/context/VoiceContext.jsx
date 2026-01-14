import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from './AppContext';

const VoiceContext = createContext();

export const useVoice = () => {
    const context = useContext(VoiceContext);
    if (!context) {
        throw new Error('useVoice must be used within VoiceProvider');
    }
    return context;
};

export const VoiceProvider = ({ children }) => {
    const { language, currentPageContent } = useApp();
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);

    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = true; // Keep listening for longer inputs like phone numbers
            recognition.interimResults = true;
            recognition.lang = language;

            recognition.onstart = () => {
                console.log('Speech recognition started');
                setIsListening(true);
                setError(null);
            };

            recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcriptPiece = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcriptPiece;
                    } else {
                        interimTranscript += transcriptPiece;
                    }
                }

                if (finalTranscript) {
                    console.log('Final transcript:', finalTranscript);
                    setTranscript(finalTranscript.trim());
                } else if (interimTranscript) {
                    console.log('Interim:', interimTranscript);
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setError(event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                console.log('Speech recognition ended');
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            setError('Speech recognition not supported in this browser');
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) { }
            }
        };
    }, [language]);

    // Start listening
    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            setError(null);
            try {
                recognitionRef.current.start();
                console.log('Started listening...');
            } catch (err) {
                console.error('Error starting recognition:', err);
            }
        }
    }, [isListening]);

    // Stop listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            try {
                recognitionRef.current.stop();
            } catch (e) { }
        }
    }, [isListening]);

    // Reset transcript
    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    // Text-to-Speech function
    const speak = useCallback((text, options = {}) => {
        return new Promise((resolve, reject) => {
            if (!text) {
                resolve();
                return;
            }

            // Cancel any ongoing speech
            synthRef.current.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = options.lang || language;
            utterance.rate = options.rate || 0.9;
            utterance.pitch = options.pitch || 1;
            utterance.volume = options.volume || 1;

            // Select appropriate voice
            const voices = synthRef.current.getVoices();
            const preferredVoice = voices.find(voice => voice.lang === utterance.lang);
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            utterance.onstart = () => {
                setIsSpeaking(true);
            };

            utterance.onend = () => {
                setIsSpeaking(false);
                resolve();
            };

            utterance.onerror = (event) => {
                setIsSpeaking(false);
                console.error('Speech synthesis error:', event);
                reject(event);
            };

            synthRef.current.speak(utterance);
        });
    }, [language]);

    // Stop speaking
    const stopSpeaking = useCallback(() => {
        synthRef.current.cancel();
        setIsSpeaking(false);
    }, []);

    // Repeat current page content
    const repeatContent = useCallback(() => {
        if (currentPageContent) {
            speak(currentPageContent);
        }
    }, [currentPageContent, speak]);

    const value = {
        isListening,
        isSpeaking,
        transcript,
        error,
        startListening,
        stopListening,
        resetTranscript,
        speak,
        stopSpeaking,
        repeatContent,
    };

    return (
        <VoiceContext.Provider value={value}>
            {children}
        </VoiceContext.Provider>
    );
};
