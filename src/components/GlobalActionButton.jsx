import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoice } from '../context/VoiceContext';
import { triggerHaptic } from '../utils/haptics';

const GlobalActionButton = ({ isActive = false }) => {
    const [showRipple, setShowRipple] = useState(false);
    const { isListening, startListening, stopListening } = useVoice();
    const location = useLocation();

    // Responsive sizing based on route and screen
    const isDashboardOrWelcome = location.pathname === '/dashboard' || location.pathname === '/welcome' || location.pathname === '/';

    // Slightly smaller, more refined sizes for elder-friendly design
    const buttonSizeClass = isDashboardOrWelcome
        ? 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28'
        : 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24';

    const iconSizeClass = isDashboardOrWelcome
        ? 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12'
        : 'w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10';

    const handleClick = () => {
        triggerHaptic();
        setShowRipple(true);
        setTimeout(() => setShowRipple(false), 800);

        // Toggle listening state
        if (isListening) {
            stopListening();
        } else {
            try {
                startListening();
                console.log('Started listening via GAB');
            } catch (err) {
                console.error('Failed to start listening:', err);
            }
        }
    };

    return (
        <>
            {/* Ripple Effect Overlay */}
            <AnimatePresence>
                {showRipple && (
                    <motion.div
                        className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="rounded-full bg-primary w-20 h-20 sm:w-24 sm:h-24"
                            initial={{ scale: 0, opacity: 0.6 }}
                            animate={{ scale: 15, opacity: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating "Tap to Say" indicator - Commented out as per user request
            {!isListening && !isActive && (
                <motion.div
                    className="fixed bottom-28 sm:bottom-32 md:bottom-36 inset-x-0 mx-auto z-30 w-max flex flex-col items-center pointer-events-none"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                        opacity: 1,
                        y: [0, -6, 0]
                    }}
                    transition={{
                        opacity: { duration: 0.3 },
                        y: {
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }
                    }}
                >
                    <div className="bg-gray-800/90 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-sm sm:text-base md:text-lg font-semibold shadow-lg backdrop-blur-sm">
                        🎙️ टैप करें बोलने के लिए
                    </div>
                    <motion.div
                        className="text-gray-800/90 text-xl sm:text-2xl mt-1"
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                    >
                        ▼
                    </motion.div>
                </motion.div>
            )}
            */}

            {/* Floating Action Button - Fixed Centered Position (no transform to avoid shift) */}
            <motion.button
                onClick={handleClick}
                className={`
                    fixed bottom-6 sm:bottom-8 z-40
                    left-0 right-0 mx-auto
                    ${buttonSizeClass}
                    rounded-full
                    flex items-center justify-center
                    shadow-xl
                    bg-gradient-to-br from-orange-400 via-primary to-orange-600
                    border-4 border-white/30
                `}
                whileTap={{ scale: 0.95 }}
                animate={isListening || isActive ? {
                    boxShadow: [
                        '0 10px 40px rgba(255, 140, 0, 0.4)',
                        '0 10px 60px rgba(255, 140, 0, 0.7)',
                        '0 10px 40px rgba(255, 140, 0, 0.4)',
                    ]
                } : {}}
                transition={isListening || isActive ? {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut'
                } : {}}
            >
                {/* Waveform Animation Background (when listening) */}
                {(isListening || isActive) && (
                    <div className="absolute inset-0 flex items-center justify-center space-x-0.5 sm:space-x-1">
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-0.5 sm:w-1 bg-white/40 rounded-full"
                                animate={{
                                    height: ['20%', '70%', '35%', '70%', '20%'],
                                }}
                                transition={{
                                    duration: 1.2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                    delay: i * 0.1
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Mic Icon */}
                <svg
                    className={`${iconSizeClass} text-white relative z-10 drop-shadow-md`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>

                {/* Pulsing Ring */}
                {(isListening || isActive) && (
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 sm:border-4 border-white/50"
                        animate={{
                            scale: [1, 1.3],
                            opacity: [0.7, 0]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeOut'
                        }}
                    />
                )}
            </motion.button>

            {/* Listening Indicator - Commented out as per user request
            <AnimatePresence>
                {(isListening || isActive) && (
                    <motion.div
                        className="fixed bottom-28 sm:bottom-36 md:bottom-40 inset-x-0 mx-auto z-40 w-max px-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <div className="bg-gray-900/90 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-base sm:text-lg md:text-xl font-medium backdrop-blur-sm shadow-premium">
                            🎙️ सुन रहा हूँ...
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            */}
        </>
    );
};

export default GlobalActionButton;
