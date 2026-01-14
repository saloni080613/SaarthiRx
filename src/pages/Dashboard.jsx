import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useVoiceButler } from '../context/VoiceButlerContext';
import { triggerAction } from '../utils/haptics';
import { cardHover, staggerContainer, staggerItem } from '../utils/animations';
import GlobalActionButton from '../components/GlobalActionButton';

const Dashboard = () => {
    const navigate = useNavigate();
    const { language, setCurrentPageContent, user } = useApp();
    const { announcePageAndAction } = useVoiceButler();

    // Use user from context (synced with Firestore)
    const userName = user?.name || 'Friend';

    const greetings = {
        'en-US': `Hello, ${userName}!`,
        'hi-IN': `नमस्ते, ${userName}!`,
        'mr-IN': `नमस्कार, ${userName}!`
    };

    const greeting = greetings[language] || greetings['en-US'];

    useEffect(() => {
        setCurrentPageContent('Dashboard. Say Scan to read a prescription.');
        announcePageAndAction('Home Screen', 'Say Scan to read a prescription', true);
    }, [setCurrentPageContent, announcePageAndAction]);

    const handleAction = (action) => {
        triggerAction();
        if (action === 'scan') {
            navigate('/prescription/1');
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
                <p className="text-xl text-gray-500">How can I help you today?</p>
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

                        {/* Text */}
                        <h2 className="text-3xl font-bold mb-2">Scan Prescription</h2>
                        <p className="text-lg opacity-90">Take a photo of your prescription</p>
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
                        <div className="text-xl font-semibold text-gray-800">My Medicines</div>
                    </motion.button>

                    {/* Reminders */}
                    <motion.button
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
                        <div className="text-xl font-semibold text-gray-800">Reminders</div>
                    </motion.button>
                </div>

                {/* Voice Commands Info */}
                <motion.div
                    className="mt-6 p-5 bg-blue-50 border-2 border-blue-200 rounded-2xl"
                    variants={staggerItem}
                >
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Voice Commands:</h3>
                    <div className="space-y-1 text-base text-blue-700">
                        <p>🎙️ "Scan" - Read a prescription</p>
                        <p>🎙️ "Home" - Return to dashboard</p>
                        <p>🎙️ "Repeat" - Hear again</p>
                    </div>
                </motion.div>
            </motion.div>

            {/* Global Action Button */}
            <GlobalActionButton />
        </motion.div>
    );
};

export default Dashboard;
