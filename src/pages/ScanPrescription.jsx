/**
 * ScanPrescription Page
 * Elder-friendly prescription capture with Gemini AI analysis
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useVoice } from '../context/VoiceContext';
import { triggerAction, triggerSuccess, triggerAlert } from '../utils/haptics';
import { compressImage, createPreviewUrl, revokePreviewUrl, clearImageData, validateImageFile } from '../utils/imageUtils';
import { analyzePrescription, checkDrugInteractions, generateVoiceSummary, generateConflictWarning } from '../services/geminiService';
import { getPrompt } from '../utils/translations';
import GlobalActionButton from '../components/GlobalActionButton';

// Scan states
const SCAN_STATES = {
    IDLE: 'IDLE',
    CAMERA_LIVE: 'CAMERA_LIVE',
    CAPTURING: 'CAPTURING',
    PREVIEW: 'PREVIEW',
    ANALYZING: 'ANALYZING',
    RESULTS: 'RESULTS',
    ERROR: 'ERROR'
};

const ScanPrescription = () => {
    const navigate = useNavigate();
    const { language, user } = useApp();
    const { speak, transcript, resetTranscript } = useVoice();

    const [scanState, setScanState] = useState(SCAN_STATES.IDLE);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [conflicts, setConflicts] = useState([]);
    const [error, setError] = useState('');

    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const imageDataRef = useRef(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // Translations
    const t = {
        title: {
            'en-US': 'Scan Prescription',
            'hi-IN': 'पर्चा स्कैन करें',
            'mr-IN': 'प्रिस्क्रिप्शन स्कॅन करा'
        },
        camera: {
            'en-US': 'Take Photo',
            'hi-IN': 'फोटो लें',
            'mr-IN': 'फोटो घ्या'
        },
        gallery: {
            'en-US': 'From Gallery',
            'hi-IN': 'गैलरी से',
            'mr-IN': 'गॅलरीमधून'
        },
        analyzing: {
            'en-US': 'Reading your prescription...',
            'hi-IN': 'आपका पर्चा पढ़ रहा हूँ...',
            'mr-IN': 'तुमचे प्रिस्क्रिप्शन वाचत आहे...'
        },
        tryAgain: {
            'en-US': 'Try Again',
            'hi-IN': 'फिर से कोशिश करें',
            'mr-IN': 'पुन्हा प्रयत्न करा'
        },
        saveRemind: {
            'en-US': 'Save & Remind Me',
            'hi-IN': 'सहेजें और याद दिलाएं',
            'mr-IN': 'जतन करा आणि आठवण करा'
        },
        morning: {
            'en-US': 'Morning',
            'hi-IN': 'सुबह',
            'mr-IN': 'सकाळ'
        },
        afternoon: {
            'en-US': 'Afternoon',
            'hi-IN': 'दोपहर',
            'mr-IN': 'दुपार'
        },
        evening: {
            'en-US': 'Evening',
            'hi-IN': 'शाम',
            'mr-IN': 'संध्याकाळ'
        },
        night: {
            'en-US': 'Night',
            'hi-IN': 'रात',
            'mr-IN': 'रात्री'
        },
        quotaError: {
            'en-US': 'The AI helper is busy right now. Please wait 2 minutes and try again.',
            'hi-IN': 'AI सहायक अभी व्यस्त है। कृपया 2 मिनट रुकें और फिर से कोशिश करें।',
            'mr-IN': 'AI सहाय्यक सध्या व्यस्त आहे. कृपया 2 मिनिटे थांबा आणि पुन्हा प्रयत्न करा.'
        },
        noMedicinesFound: {
            'en-US': 'I could not read this prescription clearly. Please take a clearer photo.',
            'hi-IN': 'मैं यह पर्चा स्पष्ट रूप से नहीं पढ़ सका। कृपया एक साफ फोटो लें।',
            'mr-IN': 'मला हे प्रिस्क्रिप्शन स्पष्टपणे वाचता आले नाही. कृपया स्पष्ट फोटो घ्या.'
        }
    };

    const getText = (key) => t[key]?.[language] || t[key]?.['en-US'] || key;

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) revokePreviewUrl(previewUrl);
            if (imageDataRef.current) {
                clearImageData(imageDataRef.current);
                imageDataRef.current = null;
            }
            // Stop camera stream on unmount
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [previewUrl]);

    // Voice command detection for camera control
    useEffect(() => {
        if (!transcript) return;

        const cmd = transcript.toLowerCase().trim();
        console.log('🎤 Voice command detected:', cmd);

        // Commands to OPEN camera (when in IDLE state)
        const openCameraCommands = ['camera', 'कैमरा', 'कॅमेरा', 'photo', 'फोटो', 'scan', 'स्कैन'];

        // Commands to CLICK/CAPTURE (when camera is live)
        const captureCommands = ['click', 'क्लिक', 'खींचो', 'capture', 'take', 'लो', 'ले लो', 'खिंचो'];

        // Check for camera open command
        if (scanState === SCAN_STATES.IDLE) {
            if (openCameraCommands.some(c => cmd.includes(c))) {
                console.log('📷 Opening camera via voice command');
                resetTranscript();
                startCamera();
                return;
            }
        }

        // Check for capture command
        if (scanState === SCAN_STATES.CAMERA_LIVE) {
            if (captureCommands.some(c => cmd.includes(c))) {
                console.log('📸 Capturing via voice command');
                resetTranscript();
                captureFromVideo();
                return;
            }
        }
    }, [transcript, scanState]);

    // Start live camera preview
    const startCamera = async () => {
        triggerAction();
        setScanState(SCAN_STATES.CAMERA_LIVE);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            speak(getPrompt('SCAN', language));
        } catch (err) {
            console.error('Camera error:', err);
            // Fallback to file input if camera not available (desktop)
            setScanState(SCAN_STATES.IDLE);
            cameraInputRef.current?.click();
        }
    };

    // Stop camera stream
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setScanState(SCAN_STATES.IDLE);
    };

    // Capture photo from video stream
    const captureFromVideo = async () => {
        if (!videoRef.current) return;

        triggerAction();

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);

        // Stop camera
        stopCamera();

        // Get image data
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];

        setPreviewUrl(dataUrl);
        imageDataRef.current = {
            base64,
            mimeType: 'image/jpeg',
            previewUrl: dataUrl
        };

        setScanState(SCAN_STATES.PREVIEW);

        // Auto-analyze after brief preview
        setTimeout(() => {
            analyzeImage();
        }, 1000);
    };

    // Handle camera capture (fallback for file input)
    const handleCameraCapture = () => {
        // Try live camera first
        startCamera();
    };

    // Handle gallery selection
    const handleGallerySelect = () => {
        triggerAction();
        fileInputRef.current?.click();
    };

    // Process selected/captured image
    const handleImageSelect = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validation = validateImageFile(file);
        if (!validation.valid) {
            setError(validation.error);
            setScanState(SCAN_STATES.ERROR);
            speak(validation.error);
            return;
        }

        try {
            setScanState(SCAN_STATES.PREVIEW);

            // Create preview
            const preview = createPreviewUrl(file);
            setPreviewUrl(preview);

            // Compress image
            const compressed = await compressImage(file);
            imageDataRef.current = { ...compressed, previewUrl: preview };

            // Auto-analyze after brief preview
            setTimeout(() => {
                analyzeImage();
            }, 1000);

        } catch (err) {
            console.error('Image processing error:', err);
            setError('Failed to process image');
            setScanState(SCAN_STATES.ERROR);
        }
    };

    // Analyze image with Gemini
    const analyzeImage = async () => {
        if (!imageDataRef.current) return;

        setScanState(SCAN_STATES.ANALYZING);
        speak(getText('analyzing'));

        try {
            const result = await analyzePrescription(
                imageDataRef.current.base64,
                imageDataRef.current.mimeType
            );

            // Privacy: Clear image data immediately after API call
            clearImageData(imageDataRef.current);
            imageDataRef.current = null;

            if (result.success && result.data?.medicines?.length > 0) {
                setAnalysisResult(result.data);

                // Check for drug interactions (Phase 5)
                const savedMeds = JSON.parse(localStorage.getItem('saarthi_medicines') || '[]');
                const drugConflicts = checkDrugInteractions(result.data.medicines, savedMeds);
                setConflicts(drugConflicts);

                setScanState(SCAN_STATES.RESULTS);
                triggerSuccess();

                // Announce results
                const summary = generateVoiceSummary(result.data.medicines, language);
                await speak(summary);

                // If conflicts, announce warning with heavy vibration
                if (drugConflicts.length > 0) {
                    triggerAlert(); // Heavy vibration
                    setTimeout(async () => {
                        const warning = generateConflictWarning(drugConflicts, language);
                        await speak(warning);
                    }, 1500);
                }

            } else {
                // Better error message for elders
                const errorMsg = result.isQuotaError
                    ? getText('quotaError')
                    : getText('noMedicinesFound');
                throw new Error(errorMsg);
            }

        } catch (err) {
            console.error('Analysis error:', err);
            setError(err.message);
            setScanState(SCAN_STATES.ERROR);
            triggerAlert();

            // Speak the actual error message (which is now elder-friendly)
            speak(err.message);
        }
    };

    // Save medicines and set reminders
    const handleSaveAndRemind = () => {
        if (!analysisResult?.medicines) return;

        triggerAction();

        // Save to localStorage
        const existing = JSON.parse(localStorage.getItem('saarthi_medicines') || '[]');
        const updated = [...existing, ...analysisResult.medicines.map(m => ({
            ...m,
            addedAt: Date.now(),
            prescriptionDate: analysisResult.date
        }))];
        localStorage.setItem('saarthi_medicines', JSON.stringify(updated));

        // TODO: Schedule notifications based on timing
        const savedMsg = {
            'en-US': 'Medicines saved. I will remind you at the right time.',
            'hi-IN': 'दवाइयां सहेजी गईं। मैं आपको सही समय पर याद दिलाऊंगा।',
            'mr-IN': 'औषधे जतन झाली. मी तुम्हाला योग्य वेळी आठवण करून देईन.'
        };
        speak(savedMsg[language] || savedMsg['hi-IN']);

        triggerSuccess();

        // Navigate to dashboard
        setTimeout(() => {
            navigate('/dashboard');
        }, 2000);
    };

    // Retry scan
    const handleRetry = () => {
        setError('');
        setAnalysisResult(null);
        setConflicts([]);
        setScanState(SCAN_STATES.IDLE);
        if (previewUrl) {
            revokePreviewUrl(previewUrl);
            setPreviewUrl(null);
        }
    };

    // Get timing icon
    const getTimingIcon = (timing) => {
        if (timing?.includes('morning')) return '☀️';
        if (timing?.includes('afternoon')) return '🌤️';
        if (timing?.includes('evening')) return '🌅';
        if (timing?.includes('night')) return '🌙';
        return '💊';
    };

    return (
        <motion.div
            className="min-h-screen flex flex-col p-6 pb-32 bg-gradient-to-b from-gray-50 to-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Hidden file inputs */}
            <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="hidden"
            />
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
            />

            {/* Title */}
            <motion.h1
                className="text-3xl font-bold text-gray-800 text-center mb-8 mt-4"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                {getText('title')}
            </motion.h1>

            <AnimatePresence mode="wait">
                {/* IDLE State - Capture Options */}
                {scanState === SCAN_STATES.IDLE && (
                    <motion.div
                        key="idle"
                        className="flex-1 flex flex-col gap-6 justify-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        {/* Camera Button - Primary */}
                        <motion.button
                            onClick={handleCameraCapture}
                            className="w-full p-8 rounded-3xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-premium-lg"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="text-6xl mb-4">📷</div>
                            <div className="text-2xl font-bold">{getText('camera')}</div>
                        </motion.button>

                        {/* Gallery Button - Secondary */}
                        <motion.button
                            onClick={handleGallerySelect}
                            className="w-full p-6 rounded-2xl bg-white border-2 border-gray-200 shadow-md"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="text-4xl mb-2">🖼️</div>
                            <div className="text-xl font-semibold text-gray-700">{getText('gallery')}</div>
                        </motion.button>
                    </motion.div>
                )}

                {/* CAMERA_LIVE State - Live Camera Preview */}
                {scanState === SCAN_STATES.CAMERA_LIVE && (
                    <motion.div
                        key="camera-live"
                        className="flex-1 flex flex-col items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Live Video Feed */}
                        <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-lg border-4 border-primary">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-auto"
                                style={{ maxHeight: '50vh' }}
                            />
                            {/* Camera overlay frame */}
                            <div className="absolute inset-0 border-4 border-dashed border-white/50 m-4 rounded-xl pointer-events-none" />
                        </div>

                        {/* Capture Button - BIG */}
                        <motion.button
                            onClick={captureFromVideo}
                            className="mt-6 w-24 h-24 rounded-full bg-white border-4 border-primary shadow-xl flex items-center justify-center"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <div className="w-16 h-16 rounded-full bg-primary" />
                        </motion.button>

                        {/* Cancel Button */}
                        <motion.button
                            onClick={stopCamera}
                            className="mt-4 px-6 py-2 text-gray-600 text-lg"
                            whileTap={{ scale: 0.95 }}
                        >
                            ✕ Cancel
                        </motion.button>
                    </motion.div>
                )}

                {/* PREVIEW State */}
                {scanState === SCAN_STATES.PREVIEW && previewUrl && (
                    <motion.div
                        key="preview"
                        className="flex-1 flex flex-col items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <img
                            src={previewUrl}
                            alt="Prescription preview"
                            className="max-w-full max-h-64 rounded-2xl shadow-lg"
                        />
                        <motion.div
                            className="mt-6 text-xl text-gray-600"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            {getText('analyzing')}
                        </motion.div>
                    </motion.div>
                )}

                {/* ANALYZING State */}
                {scanState === SCAN_STATES.ANALYZING && (
                    <motion.div
                        key="analyzing"
                        className="flex-1 flex flex-col items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="w-24 h-24 rounded-full border-4 border-primary border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <p className="mt-6 text-xl text-gray-600">{getText('analyzing')}</p>
                    </motion.div>
                )}

                {/* RESULTS State */}
                {scanState === SCAN_STATES.RESULTS && analysisResult && (
                    <motion.div
                        key="results"
                        className="flex-1 space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Conflict Warning */}
                        {conflicts.length > 0 && (
                            <motion.div
                                className="p-4 bg-red-100 border-2 border-red-500 rounded-2xl"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 0.5, repeat: 3 }}
                            >
                                <div className="text-2xl mb-2">⚠️ {conflicts[0].warning}</div>
                                <p className="text-red-700">
                                    {generateConflictWarning(conflicts, language)}
                                </p>
                            </motion.div>
                        )}

                        {/* Medicine Cards */}
                        {analysisResult.medicines.map((med, idx) => (
                            <motion.div
                                key={idx}
                                className="p-5 bg-white rounded-2xl shadow-md border-l-4 border-primary"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="text-4xl">
                                        {getTimingIcon(med.timing)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-800">{med.name}</h3>
                                        <p className="text-gray-600">{med.dosage} - {med.frequency}</p>
                                        {med.visualDescription && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                💊 {med.visualDescription}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Save & Remind Button */}
                        <motion.button
                            onClick={handleSaveAndRemind}
                            className="w-full p-5 rounded-2xl bg-green-500 text-white text-xl font-bold shadow-lg"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            ✅ {getText('saveRemind')}
                        </motion.button>
                    </motion.div>
                )}

                {/* ERROR State */}
                {scanState === SCAN_STATES.ERROR && (
                    <motion.div
                        key="error"
                        className="flex-1 flex flex-col items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="text-6xl mb-4">❌</div>
                        <p className="text-xl text-red-600 text-center mb-6">{error}</p>
                        <motion.button
                            onClick={handleRetry}
                            className="px-8 py-4 bg-primary text-white rounded-full text-xl font-semibold"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {getText('tryAgain')}
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            <GlobalActionButton />
        </motion.div>
    );
};

export default ScanPrescription;
