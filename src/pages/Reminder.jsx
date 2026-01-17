import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useVoiceButler } from '../context/VoiceButlerContext';
import { useVoice } from '../context/VoiceContext';
import { triggerAlert, triggerSuccess } from '../utils/haptics';

// ============================================
// SERVERLESS NOTIFICATION UTILITIES
// ============================================

/**
 * Request browser notification permission (must be called from user gesture)
 * @returns {Promise<string>} Permission status
 */
const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.warn('Browser does not support notifications');
        return 'unsupported';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        return 'denied';
    }

    try {
        const permission = await Notification.requestPermission();
        console.log('Notification permission result:', permission);
        return permission;
    } catch (error) {
        console.error('Notification permission request failed:', error);
        return 'error';
    }
};

/**
 * Trigger a browser notification with optional vibration (haptic feedback)
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @returns {Notification|null} The notification object or null
 */
const triggerBrowserNotification = (title, body) => {
    console.log('Attempting to trigger notification:', { title, body });

    // Haptic feedback - vibrate pattern for urgency
    if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 300]);
        console.log('Vibration triggered');
    }

    if (!('Notification' in window)) {
        console.error('Notifications not supported in this browser');
        alert(`📢 ${title}\n\n${body}`); // Fallback to alert
        return null;
    }

    if (Notification.permission !== 'granted') {
        console.error('Notification permission not granted. Current status:', Notification.permission);
        alert(`📢 ${title}\n\n${body}`); // Fallback to alert
        return null;
    }

    try {
        const notification = new Notification(title, {
            body,
            icon: '/vite.svg', // Use a valid icon path
            badge: '/vite.svg',
            requireInteraction: true,
            tag: 'medication-reminder-' + Date.now(),
            silent: false
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        console.log('Notification created successfully');

        // Auto-close after 30 seconds
        setTimeout(() => notification.close(), 30000);

        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        alert(`📢 ${title}\n\n${body}`); // Fallback to alert
        return null;
    }
};

/**
 * Open WhatsApp with pre-filled message for caretaker notification
 * @param {string} medicineName - Name of the medicine taken
 * @param {string} phoneNumber - Caretaker's phone number (optional)
 */
const notifyCaretaker = (medicineName, phoneNumber = '') => {
    const userName = JSON.parse(localStorage.getItem('userData') || '{}').name || 'I';
    const message = encodeURIComponent(
        `Hi! 👋\n\n✅ ${userName} just took their medication: *${medicineName}*\n\n🕐 Time: ${new Date().toLocaleTimeString()}\n📅 Date: ${new Date().toLocaleDateString()}\n\nAll good! 💚`
    );

    const whatsappUrl = phoneNumber
        ? `https://wa.me/${phoneNumber}?text=${message}`
        : `https://wa.me/?text=${message}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};

// ============================================
// REMINDER COMPONENT
// ============================================

const Reminder = () => {
    const navigate = useNavigate();
    const { language } = useApp();
    const { announce } = useVoiceButler();
    const { transcript } = useVoice();
    const [dismissed, setDismissed] = useState(false);
    const [snoozed, setSnoozed] = useState(false);
    const [notificationStatus, setNotificationStatus] = useState('default'); // 'default', 'granted', 'denied', 'unsupported'
    const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
    const missedNotificationSent = useRef(false);
    const reminderTimeoutRef = useRef(null);

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const userName = userData.name || 'Friend';
    const caretakerPhone = userData.caretakerPhone || '';

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

    const buttonLabels = {
        'en-US': {
            taken: '✓ I have taken it',
            snooze: '⏰ Snooze (5 min)',
            skip: '✗ Skip this dose',
            voiceHint: 'Or say "Taken" 🎙️'
        },
        'hi-IN': {
            taken: '✓ मैंने ले ली',
            snooze: '⏰ स्नूज़ (5 मिनट)',
            skip: '✗ यह खुराक छोड़ें',
            voiceHint: 'या "ले लिया" बोलें 🎙️'
        },
        'mr-IN': {
            taken: '✓ मी घेतली',
            snooze: '⏰ स्नूझ (5 मिनिटे)',
            skip: '✗ हा डोस वगळा',
            voiceHint: 'किंवा "घेतली" म्हणा 🎙️'
        }
    };

    const labels = buttonLabels[language] || buttonLabels['en-US'];
    const message = messages[language] || messages['en-US'];

    // Check notification status on mount
    useEffect(() => {
        if ('Notification' in window) {
            setNotificationStatus(Notification.permission);
            if (Notification.permission === 'default') {
                setShowNotificationPrompt(true);
            }
        } else {
            setNotificationStatus('unsupported');
        }
    }, []);

    // Handler for enabling notifications (must be called from user gesture)
    const handleEnableNotifications = async () => {
        const result = await requestNotificationPermission();
        setNotificationStatus(result);
        setShowNotificationPrompt(false);

        if (result === 'granted') {
            // Send a test notification to confirm it works
            triggerBrowserNotification(
                '🔔 Notifications Enabled!',
                'You will now receive medication reminders.'
            );
        }
    };

    // Set up "missed dose" notification after 15 seconds (demo) - change to 60000 for production
    useEffect(() => {
        if (dismissed || snoozed || missedNotificationSent.current) return;

        console.log('Setting up missed dose notification timer (15 seconds for demo)');

        reminderTimeoutRef.current = setTimeout(() => {
            if (!dismissed && !snoozed && !missedNotificationSent.current) {
                missedNotificationSent.current = true;
                console.log('Triggering missed dose notification');

                // Trigger browser notification
                triggerBrowserNotification(
                    '⚠️ Medication Reminder',
                    `${userName}, you haven't taken your ${medicine.name} yet. Please take it now!`
                );

                // Intense haptic feedback
                if ('vibrate' in navigator) {
                    navigator.vibrate([500, 200, 500, 200, 500]);
                }
            }
        }, 15000); // 15 seconds for demo - change to 60000 for production

        return () => {
            if (reminderTimeoutRef.current) {
                clearTimeout(reminderTimeoutRef.current);
            }
        };
    }, [dismissed, snoozed, userName, medicine.name]);

    // Continuous alert haptic and voice announcements
    useEffect(() => {
        if (snoozed) return;

        const vibrationInterval = setInterval(() => {
            triggerAlert();
        }, 2000);

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
    }, [message, announce, dismissed, snoozed]);

    // Check for voice commands
    useEffect(() => {
        if (transcript) {
            const lowerTranscript = transcript.toLowerCase();
            if (lowerTranscript.includes('taken') ||
                lowerTranscript.includes('ले लिया') ||
                lowerTranscript.includes('घेतली')) {
                handleTaken();
            } else if (lowerTranscript.includes('snooze') ||
                lowerTranscript.includes('स्नूज़') ||
                lowerTranscript.includes('स्नूझ')) {
                handleSnooze();
            }
        }
    }, [transcript]);

    const handleTaken = useCallback(() => {
        triggerSuccess();
        setDismissed(true);

        // Clear any pending notification timeout
        if (reminderTimeoutRef.current) {
            clearTimeout(reminderTimeoutRef.current);
        }

        // Open WhatsApp to notify caretaker
        setTimeout(() => {
            notifyCaretaker(medicine.name, caretakerPhone);
        }, 300);

        setTimeout(() => {
            navigate('/dashboard');
        }, 1000);
    }, [navigate, medicine.name, caretakerPhone]);

    const handleSnooze = useCallback(() => {
        // Haptic feedback for snooze
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }

        setSnoozed(true);

        // Clear pending notification
        if (reminderTimeoutRef.current) {
            clearTimeout(reminderTimeoutRef.current);
        }

        // Re-trigger after 5 minutes (300000ms), using 10 seconds for demo
        setTimeout(() => {
            setSnoozed(false);
            missedNotificationSent.current = false;
            triggerAlert();
            announce(message);
        }, 10000); // 10 seconds for demo (change to 300000 for production)

        // Navigate away temporarily
        setTimeout(() => {
            navigate('/dashboard');
        }, 500);
    }, [navigate, message, announce]);

    const handleSkip = useCallback(() => {
        // Haptic feedback for skip
        if ('vibrate' in navigator) {
            navigator.vibrate([50, 30, 50]);
        }

        // Clear pending notification
        if (reminderTimeoutRef.current) {
            clearTimeout(reminderTimeoutRef.current);
        }

        setDismissed(true);
        setTimeout(() => {
            navigate('/dashboard');
        }, 500);
    }, [navigate]);

    // Success confirmation screen
    if (dismissed) {
        return (
            <motion.div
                className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-400 via-emerald-500 to-green-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="text-9xl mb-6"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                >
                    ✓
                </motion.div>
                <motion.p
                    className="text-white text-3xl font-bold"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    Great job, {userName}!
                </motion.p>
                <motion.p
                    className="text-white/80 text-xl mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    Notifying your caretaker...
                </motion.p>
            </motion.div>
        );
    }

    // Snoozed confirmation screen
    if (snoozed) {
        return (
            <motion.div
                className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="text-9xl mb-6"
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    ⏰
                </motion.div>
                <motion.p
                    className="text-white text-3xl font-bold text-center px-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    Snoozed! We'll remind you soon.
                </motion.p>
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
            <div className="relative z-10 text-center w-full max-w-md">
                {/* Alert Icon */}
                <motion.div
                    className="mb-6"
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
                    className="text-4xl md:text-5xl font-display font-bold mb-4 leading-tight"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Medicine Time!
                </motion.h1>

                <motion.p
                    className="text-xl md:text-2xl mb-6 leading-relaxed px-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    {message}
                </motion.p>

                {/* Visual Pill */}
                <motion.div
                    className="flex justify-center mb-8"
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
                        className="w-20 h-20 rounded-full shadow-premium-lg border-4 border-white"
                        style={{
                            backgroundColor: medicine.color,
                            boxShadow: '0 15px 40px rgba(0,0,0,0.4), inset 0 -8px 15px rgba(0,0,0,0.2)'
                        }}
                    />
                </motion.div>

                {/* Notification Permission Prompt */}
                {showNotificationPrompt && notificationStatus === 'default' && (
                    <motion.div
                        className="mb-6 p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <p className="text-white text-lg mb-3">
                            🔔 Enable notifications to get reminders even when this tab is in background
                        </p>
                        <button
                            onClick={handleEnableNotifications}
                            className="px-6 py-3 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:bg-blue-50 transition-colors"
                        >
                            Enable Notifications
                        </button>
                    </motion.div>
                )}

                {/* === HIGH-CONTRAST ELDERLY-FRIENDLY BUTTONS === */}
                <div className="space-y-4 px-2">
                    {/* TAKEN Button - Large Green */}
                    <motion.button
                        onClick={handleTaken}
                        className="
                            w-full
                            min-h-[100px] px-8 py-5
                            bg-green-500 hover:bg-green-400
                            text-white
                            rounded-3xl
                            font-bold text-2xl md:text-3xl
                            shadow-2xl
                            border-4 border-green-300
                            flex items-center justify-center gap-3
                        "
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        animate={{
                            boxShadow: [
                                '0 0 0 0 rgba(34, 197, 94, 0.7)',
                                '0 0 0 15px rgba(34, 197, 94, 0)',
                            ]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeOut"
                        }}
                    >
                        <span className="text-4xl">✓</span>
                        <span>{labels.taken}</span>
                    </motion.button>

                    {/* SNOOZE Button - Amber/Orange */}
                    <motion.button
                        onClick={handleSnooze}
                        className="
                            w-full
                            min-h-[80px] px-6 py-4
                            bg-amber-500 hover:bg-amber-400
                            text-white
                            rounded-2xl
                            font-bold text-xl md:text-2xl
                            shadow-xl
                            border-3 border-amber-300
                            flex items-center justify-center gap-3
                        "
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span className="text-3xl">⏰</span>
                        <span>{labels.snooze}</span>
                    </motion.button>

                    {/* SKIP Button - Red (smaller, less prominent) */}
                    <motion.button
                        onClick={handleSkip}
                        className="
                            w-full
                            min-h-[70px] px-6 py-3
                            bg-red-600/80 hover:bg-red-500
                            text-white
                            rounded-2xl
                            font-semibold text-lg md:text-xl
                            shadow-lg
                            border-2 border-red-400/50
                            flex items-center justify-center gap-3
                        "
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span className="text-2xl">✗</span>
                        <span>{labels.skip}</span>
                    </motion.button>
                </div>

                {/* Voice Command Hint */}
                <motion.p
                    className="mt-6 text-lg opacity-90"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    {labels.voiceHint}
                </motion.p>

                {/* Notification Status Indicator */}
                {notificationStatus === 'granted' && (
                    <motion.div
                        className="mt-4 flex items-center justify-center gap-2 text-sm opacity-75"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.75 }}
                        transition={{ delay: 1 }}
                    >
                        <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                        <span>Notifications enabled</span>
                    </motion.div>
                )}
                {notificationStatus === 'denied' && (
                    <motion.div
                        className="mt-4 flex items-center justify-center gap-2 text-sm opacity-75"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.75 }}
                        transition={{ delay: 1 }}
                    >
                        <span className="w-2 h-2 bg-red-400 rounded-full" />
                        <span>Notifications blocked - check browser settings</span>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default Reminder;
