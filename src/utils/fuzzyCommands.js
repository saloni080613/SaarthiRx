import Fuse from 'fuse.js';

// Command database with synonyms
const commands = [
    {
        action: 'HOME',
        keywords: ['home', 'dashboard', 'main menu', 'go home', 'return', 'back home'],
        hindiKeywords: ['होम', 'घर', 'मुख्य मेनू', 'वापस'],
        marathiKeywords: ['घर', 'मुख्य मेनू', 'परत']
    },
    {
        action: 'SCAN',
        keywords: ['scan', 'take picture', 'photo', 'camera', 'new prescription', 'scan prescription'],
        hindiKeywords: ['स्कैन', 'फोटो', 'कैमरा', 'तस्वीर'],
        marathiKeywords: ['स्कॅन', 'फोटो', 'कॅमेरा', 'चित्र']
    },
    {
        action: 'MEDICINES',
        keywords: ['medicines', 'my medicines', 'pills', 'drugs', 'show medicines', 'show pills'],
        hindiKeywords: ['दवाइयां', 'मेरी दवाइयां', 'गोलियां'],
        marathiKeywords: ['औषधे', 'माझी औषधे', 'गोळ्या']
    },
    {
        action: 'REMINDERS',
        keywords: ['reminders', 'alerts', 'notifications', 'my reminders'],
        hindiKeywords: ['रिमाइंडर', 'अलर्ट', 'सूचनाएं'],
        marathiKeywords: ['आठवणी', 'सूचना']
    },
    {
        action: 'REPEAT',
        keywords: ['repeat', 'say again', 'what', 'pardon', 'again'],
        hindiKeywords: ['दोहराएं', 'फिर से', 'क्या'],
        marathiKeywords: ['पुन्हा', 'परत सांगा']
    },
    {
        action: 'HELP',
        keywords: ['help', 'what can you do', 'commands', 'assist'],
        hindiKeywords: ['मदद', 'सहायता'],
        marathiKeywords: ['मदत', 'साहाय्य']
    }
];

// Flatten all keywords for fuzzy matching
const getAllKeywords = () => {
    return commands.flatMap(cmd => [
        ...cmd.keywords.map(k => ({ keyword: k, action: cmd.action })),
        ...cmd.hindiKeywords.map(k => ({ keyword: k, action: cmd.action })),
        ...cmd.marathiKeywords.map(k => ({ keyword: k, action: cmd.action }))
    ]);
};

// Configure Fuse.js for fuzzy matching
const fuse = new Fuse(getAllKeywords(), {
    keys: ['keyword'],
    threshold: 0.4, // Lower = more strict, Higher = more fuzzy
    ignoreLocation: true,
    minMatchCharLength: 2
});

/**
 * Parse user voice input with fuzzy matching
 * @param {string} input - User's voice input
 * @returns {Object} { action: string, confidence: number }
 */
export const parseFuzzyCommand = (input) => {
    if (!input || typeof input !== 'string') {
        return { action: 'UNKNOWN', confidence: 0 };
    }

    const normalizedInput = input.toLowerCase().trim();

    // First try exact match
    for (const cmd of commands) {
        const allKeywords = [...cmd.keywords, ...cmd.hindiKeywords, ...cmd.marathiKeywords];
        if (allKeywords.some(k => normalizedInput.includes(k.toLowerCase()))) {
            return { action: cmd.action, confidence: 1 };
        }
    }

    // Fuzzy match
    const results = fuse.search(normalizedInput);

    if (results.length > 0) {
        return {
            action: results[0].item.action,
            confidence: 1 - results[0].score // Convert score to confidence
        };
    }

    return { action: 'UNKNOWN', confidence: 0 };
};

/**
 * Get command suggestions based on partial input
 * @param {string} input - Partial input
 * @returns {Array} List of suggested commands
 */
export const getCommandSuggestions = (input) => {
    if (!input) return [];

    const results = fuse.search(input, { limit: 3 });
    return results.map(r => ({
        action: r.item.action,
        keyword: r.item.keyword
    }));
};
