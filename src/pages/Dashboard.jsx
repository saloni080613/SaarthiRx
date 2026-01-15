import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useVoiceButler } from '../context/VoiceButlerContext';
import { triggerAction } from '../utils/haptics';
import { cardHover, staggerContainer, staggerItem } from '../utils/animations';
import { getPrompt } from '../utils/translations';
import GlobalActionButton from '../components/GlobalActionButton';

const Dashboard = () => {
    const navigate = useNavigate();
    const { language, setCurrentPageContent, user } = useApp();
    const { announcePageAndAction } = useVoiceButler();

    // One-shot flag to prevent audio loop (Phase 3 fix)
    const hasAnnounced = useRef(false);

    // Use user from context (synced with Firestore)
    const userName = user?.name || 'Friend';

    const greetings = {
        'en-US': `Hello, ${userName}!`,
        'hi-IN': `नमस्ते, ${userName}!`,
        'mr-IN': `नमस्कार, ${userName}!`
    };

    const greeting = greetings[language] || greetings['en-US'];

    useEffect(() => {
        // Only announce ONCE per mount (fixes "Parrot Loop")
        if (!hasAnnounced.current) {
            hasAnnounced.current = true;

            const pageContent = getPrompt('DASHBOARD_ANNOUNCE', language);
            setCurrentPageContent(pageContent);

            // Simplified, elder-friendly prompt
            announcePageAndAction(
                greeting,
                getPrompt('DASHBOARD_ANNOUNCE', language),
                true
            );
        }
    }, [greeting, language, setCurrentPageContent, announcePageAndAction]);

    const handleAction = (action) => {
        triggerAction();
        if (action === 'scan') {
            navigate('/scan');
        } else if (action === 'medicines') {
            // TODO: Navigate to medicines
        } else if (action === 'reminders') {
            navigate('/reminder');
        }
    };

    return (
        <motion.div
            className="min-h-screen flex flex-col p-6 pb-32 relative overflow-y-auto bg-gradient-to-b from-gray-50 to-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Hero Greeting */}
            <motion.div
                className="text-center mb-10 mt-8"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-800 mb-2">
                    {greeting}
                </h1>
                <p className="text-xl text-gray-500">
                    {getPrompt('DASHBOARD_SUBTITLE', language)}
                </p>
            </motion.div>

            {/* Main Action Cards */}
            <motion.div
                className="space-y-4"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
            >
                {/* Scan Prescription - Primary Action */}
                <motion.button
                    onClick={() => handleAction('scan')}
                    className="
            w-full p-8 rounded-3xl
            bg-gradient-to-br from-primary to-primary-dark
            text-white shadow-premium-lg
            relative overflow-hidden
            group
          "
                    variants={{ ...cardHover, ...staggerItem }}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                >
                    <div className="relative z-10">
                        {/* Icon */}
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-5xl">📸</span>
                            </div>
                        </div>

                        {/* Text - Localized */}
                        <h2 className="text-3xl font-bold mb-2">
                            {getPrompt('DASHBOARD_SCAN_TITLE', language)}
                        </h2>
                        <p className="text-lg opacity-90">
                            {getPrompt('DASHBOARD_SCAN_SUBTITLE', language)}
                        </p>
                    </div>

                    {/* Animated Background */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-primary-light to-primary opacity-0 group-hover:opacity-100"
                        transition={{ duration: 0.3 }}
                    />
                </motion.button>

                {/* Secondary Actions Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* My Medicines */}
                    <motion.button
                        onClick={() => handleAction('medicines')}
                        className="
              p-6 rounded-2xl
              bg-white border-2 border-gray-200
              shadow-md hover:shadow-premium
              transition-all
            "
                        variants={{ ...cardHover, ...staggerItem }}
                        initial="rest"
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <div className="text-4xl mb-3">💊</div>
                        <div className="text-xl font-semibold text-gray-800">
                            {getPrompt('DASHBOARD_MEDICINES', language)}
                        </div>
                    </motion.button>

                    {/* Reminders */}
                    <motion.button
                        onClick={() => handleAction('reminders')}
                        className="
              p-6 rounded-2xl
              bg-white border-2 border-gray-200
              shadow-md hover:shadow-premium
              transition-all
            "
                        variants={{ ...cardHover, ...staggerItem }}
                        initial="rest"
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <div className="text-4xl mb-3">⏰</div>
                        <div className="text-xl font-semibold text-gray-800">
                            {getPrompt('DASHBOARD_REMINDERS', language)}
                        </div>
                    </motion.button>
                </div>

                {/* Voice Commands Info - Localized */}
                <motion.div
                    className="mt-6 p-5 bg-blue-50 border-2 border-blue-200 rounded-2xl"
                    variants={staggerItem}
                >
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">
                        {getPrompt('DASHBOARD_VOICE_TITLE', language)}
                    </h3>
                    <div className="space-y-1 text-base text-blue-700">
                        <p>{getPrompt('DASHBOARD_VOICE_SCAN', language)}</p>
                        <p>{getPrompt('DASHBOARD_VOICE_HOME', language)}</p>
                        <p>{getPrompt('DASHBOARD_VOICE_REPEAT', language)}</p>
                    </div>
                </motion.div>
            </motion.div>

            {/* Global Action Button */}
            <GlobalActionButton />
        </motion.div>
    );
};

export default Dashboard;
