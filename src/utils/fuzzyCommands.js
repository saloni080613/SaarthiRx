import Fuse from 'fuse.js';

// Command database with synonyms - Simple One-Word Elder-Friendly Keywords
const commands = [
    {
        action: 'HOME',
        keywords: ['home', 'dashboard', 'main', 'go home'],
        hindiKeywords: ['होम', 'घर', 'डैशबोर्ड'],
        marathiKeywords: ['घर', 'होम', 'डॅशबोर्ड']
    },
    {
        action: 'SCAN',
        keywords: ['scan', 'camera', 'photo', 'picture'],
        hindiKeywords: ['स्कैन', 'कैमरा', 'फोटो'],
        marathiKeywords: ['स्कॅन', 'कॅमेरा', 'फोटो']
    },
    {
        action: 'MEDICINES',
        keywords: ['medicines', 'pills', 'medicine', 'pill', 'my medicines'],
        hindiKeywords: ['दवाई', 'दवाइयां', 'गोली', 'गोलियां'],
        marathiKeywords: ['औषध', 'औषधे', 'गोळी', 'गोळ्या']
    },
    {
        action: 'REMINDERS',
        keywords: ['reminders', 'reminder', 'alarm', 'alerts'],
        hindiKeywords: ['रिमाइंडर', 'अलार्म', 'याद'],
        marathiKeywords: ['रिमाइंडर', 'आठवण', 'अलार्म']
    },
    {
        action: 'BACK',
        keywords: ['back', 'return', 'go back', 'previous'],
        hindiKeywords: ['वापस', 'पीछे', 'लौटो'],
        marathiKeywords: ['मागे', 'परत', 'मागे जा']
    },
    {
        action: 'REPEAT',
        keywords: ['repeat', 'again', 'what', 'pardon'],
        hindiKeywords: ['दोहराओ', 'फिर से', 'क्या'],
        marathiKeywords: ['पुन्हा', 'परत सांग']
    },
    {
        action: 'HELP',
        keywords: ['help', 'commands', 'assist'],
        hindiKeywords: ['मदद', 'सहायता', 'हेल्प'],
        marathiKeywords: ['मदत', 'साहाय्य', 'हेल्प']
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
