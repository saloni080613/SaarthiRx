import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from './AppContext';
import { triggerHaptic } from '../utils/haptics';

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
    const silenceTimerRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = true; // Keep listening for longer inputs like phone numbers
            recognition.interimResults = true;
            recognition.lang = language;

            recognition.onstart = () => {
                console.log('🎙️ Speech recognition started');
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
                    console.log('✅ Final transcript:', finalTranscript);
                    setTranscript(finalTranscript.trim());
                } else if (interimTranscript) {
                    console.log('📝 Interim:', interimTranscript);
                }

                // Auto-stop detection: Reset timer on every result (speech detected)
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

                // 1.5 seconds of silence after speech → auto-stop mic (elder-friendly)
                silenceTimerRef.current = setTimeout(() => {
                    console.log('🤫 Silence detected, auto-stopping mic...');
                    triggerHaptic([50, 50]); // Success chime haptic
                    if (recognitionRef.current) {
                        try {
                            recognitionRef.current.stop();
                        } catch (e) { }
                    }
                }, 1500);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setError(event.error);
                setIsListening(false);
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            };

            recognition.onend = () => {
                console.log('🛑 Speech recognition ended');
                setIsListening(false);
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
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
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        };
    }, [language]);

    // Start listening
    const startListening = useCallback(() => {
        // MUTEX: Don't allow listening while speaking
        if (isSpeaking) {
            console.warn('🔇 Mic blocked: TTS is currently active');
            return;
        }

        if (recognitionRef.current && !isListening) {
            setTranscript('');
            setError(null);
            try {
                recognitionRef.current.start();
                console.log('🎙️ Started listening...');

                // Start a 5-second "no speech" timeout
                // If user doesn't say anything, auto-stop after 5 seconds
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = setTimeout(() => {
                    console.log('⏱️ No speech detected for 5s, auto-stopping...');
                    triggerHaptic([30, 30]); // Soft haptic for timeout
                    if (recognitionRef.current) {
                        try {
                            recognitionRef.current.stop();
                        } catch (e) { }
                    }
                }, 5000);

            } catch (err) {
                console.error('Error starting recognition:', err);
            }
        }
    }, [isListening, isSpeaking]);

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
                if (event.error === 'not-allowed') {
                    console.warn('⚠️ Speech blocked by browser autoplay policy. User interaction required.');
                    resolve(); // Resolve to let the app continue silently
                } else {
                    console.error('Speech synthesis error:', event);
                    // reject(event); // Don't reject to avoid unhandled promise crashes
                    resolve(); // Just resolve to keep flow moving
                }
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
