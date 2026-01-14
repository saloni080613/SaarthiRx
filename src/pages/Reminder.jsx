import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useVoiceButler } from '../context/VoiceButlerContext';
import { useVoice } from '../context/VoiceContext';
import { triggerAlert, triggerSuccess } from '../utils/haptics';

const Reminder = () => {
    const navigate = useNavigate();
    const { language } = useApp();
    const { announce } = useVoiceButler();
    const { transcript } = useVoice();
    const [dismissed, setDismissed] = useState(false);

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const userName = userData.name || 'Friend';

    const medicine = {
        name: 'Amlodipine 5mg',
        description: 'blue round tablet',
        color: '#3B82F6'
    };

    const messages = {
        'en-US': `${userName}, it is time for your ${medicine.description}. Please take it now.`,
        'hi-IN': `${userName}, आपकी ${medicine.description} लेने का समय हो गया है। कृपया अभी लें।`,
        'mr-IN': `${userName}, तुमची ${medicine.description} घेण्याची वेळ झाली आहे. कृपया आता घ्या.`
    };

    const message = messages[language] || messages['en-US'];

    useEffect(() => {
        // Continuous alert haptic
        const vibrationInterval = setInterval(() => {
            triggerAlert();
        }, 2000);

        // Voice announcement every 10 seconds
        const voiceInterval = setInterval(() => {
            if (!dismissed) {
                announce(message);
            }
        }, 10000);

        // Initial announcement
        announce(message);

        return () => {
            clearInterval(vibrationInterval);
            clearInterval(voiceInterval);
        };
    }, [message, announce, dismissed]);

    useEffect(() => {
        // Check for voice "Taken" command
        if (transcript && (transcript.toLowerCase().includes('taken') || transcript.toLowerCase().includes('ले लिया') || transcript.toLowerCase().includes('घेतली'))) {
            handleDismiss();
        }
    }, [transcript]);

    const handleDismiss = () => {
        triggerSuccess();
        setDismissed(true);
        setTimeout(() => {
            navigate('/dashboard');
        }, 500);
    };

    if (dismissed) {
        return (
            <motion.div
                className="min-h-screen flex items-center justify-center bg-green-500"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="text-6xl">✓</div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-500 via-orange-500 to-red-600 text-white relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Pulsing Background */}
            <motion.div
                className="absolute inset-0 bg-red-600/30"
                animate={{
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Content */}
            <div className="relative z-10 text-center">
                {/* Alert Icon */}
                <motion.div
                    className="mb-8"
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <div className="text-8xl mb-4">⏰</div>
                </motion.div>

                {/* Message */}
                <motion.h1
                    className="text-4xl md:text-5xl font-display font-bold mb-6 leading-tight"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Medicine Time!
                </motion.h1>

                <motion.p
                    className="text-2xl md:text-3xl mb-8 leading-relaxed max-w-md px-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    {message}
                </motion.p>

                {/* Visual Pill */}
                <motion.div
                    className="flex justify-center mb-10"
                    animate={{
                        y: [0, -15, 0]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <div
                        className="w-24 h-24 rounded-full shadow-premium-lg border-4 border-white"
                        style={{
                            backgroundColor: medicine.color,
                            boxShadow: '0 15px 40px rgba(0,0,0,0.4), inset 0 -8px 15px rgba(0,0,0,0.2)'
                        }}
                    />
                </motion.div>

                {/* Dismissal Button */}
                <motion.button
                    onClick={handleDismiss}
                    className="
            w-full max-w-md
            min-h-[120px] px-8 py-6
            bg-white text-green-600
            rounded-3xl
            font-bold text-3xl
            shadow-premium-lg
            border-4 border-green-400
          "
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                        boxShadow: [
                            '0 0 0 0 rgba(255,255,255,0.7)',
                            '0 0 0 20px rgba(255,255,255,0)',
                        ]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut"
                    }}
                >
                    ✓ I have taken it
                </motion.button>

                <motion.p
                    className="mt-6 text-lg opacity-90"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    Or say "Taken" 🎙️
                </motion.p>
            </div>
        </motion.div>
    );
};

export default Reminder;
