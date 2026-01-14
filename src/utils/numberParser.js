// Hindi and Marathi number words to digits parser

// Hindi number words
const HINDI_NUMBERS = {
    'शून्य': 0, 'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4,
    'पांच': 5, 'पाँच': 5, 'छह': 6, 'छः': 6, 'सात': 7, 'आठ': 8, 'नौ': 9,
    'दस': 10, 'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14,
    'पंद्रह': 15, 'सोलह': 16, 'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19,
    'बीस': 20, 'इक्कीस': 21, 'बाईस': 22, 'तेईस': 23, 'चौबीस': 24,
    'पच्चीस': 25, 'छब्बीस': 26, 'सत्ताईस': 27, 'अट्ठाईस': 28, 'उनतीस': 29,
    'तीस': 30, 'इकतीस': 31, 'बत्तीस': 32, 'तैंतीस': 33, 'चौंतीस': 34,
    'पैंतीस': 35, 'छत्तीस': 36, 'सैंतीस': 37, 'अड़तीस': 38, 'उनतालीस': 39,
    'चालीस': 40, 'इकतालीस': 41, 'बयालीस': 42, 'तैंतालीस': 43, 'चवालीस': 44,
    'पैंतालीस': 45, 'छियालीस': 46, 'सैंतालीस': 47, 'अड़तालीस': 48, 'उनचास': 49,
    'पचास': 50, 'इक्यावन': 51, 'बावन': 52, 'तिरपन': 53, 'चौवन': 54,
    'पचपन': 55, 'छप्पन': 56, 'सत्तावन': 57, 'अठावन': 58, 'उनसठ': 59,
    'साठ': 60, 'इकसठ': 61, 'बासठ': 62, 'तिरसठ': 63, 'चौंसठ': 64,
    'पैंसठ': 65, 'छियासठ': 66, 'सड़सठ': 67, 'अड़सठ': 68, 'उनहत्तर': 69,
    'सत्तर': 70, 'इकहत्तर': 71, 'बहत्तर': 72, 'तिहत्तर': 73, 'चौहत्तर': 74,
    'पचहत्तर': 75, 'छिहत्तर': 76, 'सतहत्तर': 77, 'अठहत्तर': 78, 'उन्यासी': 79,
    'अस्सी': 80, 'इक्यासी': 81, 'बयासी': 82, 'तिरासी': 83, 'चौरासी': 84,
    'पचासी': 85, 'छियासी': 86, 'सतासी': 87, 'अट्ठासी': 88, 'नवासी': 89,
    'नब्बे': 90, 'इक्यानबे': 91, 'बानबे': 92, 'तिरानबे': 93, 'चौरानबे': 94,
    'पंचानबे': 95, 'छियानबे': 96, 'सत्तानबे': 97, 'अट्ठानबे': 98, 'निन्यानबे': 99,
    'सौ': 100
};

// Marathi number words
const MARATHI_NUMBERS = {
    'शून्य': 0, 'एक': 1, 'दोन': 2, 'तीन': 3, 'चार': 4,
    'पाच': 5, 'सहा': 6, 'सात': 7, 'आठ': 8, 'नऊ': 9,
    'दहा': 10, 'अकरा': 11, 'बारा': 12, 'तेरा': 13, 'चौदा': 14,
    'पंधरा': 15, 'सोळा': 16, 'सतरा': 17, 'अठरा': 18, 'एकोणीस': 19,
    'वीस': 20, 'एकवीस': 21, 'बावीस': 22, 'तेवीस': 23, 'चोवीस': 24,
    'पंचवीस': 25, 'सव्वीस': 26, 'सत्तावीस': 27, 'अठ्ठावीस': 28, 'एकोणतीस': 29,
    'तीस': 30, 'एकतीस': 31, 'बत्तीस': 32, 'तेहेतीस': 33, 'चौतीस': 34,
    'पस्तीस': 35, 'छत्तीस': 36, 'सदतीस': 37, 'अडतीस': 38, 'एकोणचाळीस': 39,
    'चाळीस': 40, 'एक्केचाळीस': 41, 'बेचाळीस': 42, 'त्रेचाळीस': 43, 'चव्वेचाळीस': 44,
    'पंचेचाळीस': 45, 'शेहेचाळीस': 46, 'सत्तेचाळीस': 47, 'अठ्ठेचाळीस': 48, 'एकोणपन्नास': 49,
    'पन्नास': 50, 'एक्कावन्न': 51, 'बावन्न': 52, 'त्रेपन्न': 53, 'चोपन्न': 54,
    'पंचावन्न': 55, 'छप्पन्न': 56, 'सत्तावन्न': 57, 'अठ्ठावन्न': 58, 'एकोणसाठ': 59,
    'साठ': 60, 'एकसष्ट': 61, 'बासष्ट': 62, 'त्रेसष्ट': 63, 'चौसष्ट': 64,
    'पासष्ट': 65, 'सहासष्ट': 66, 'सदुसष्ट': 67, 'अडुसष्ट': 68, 'एकोणसत्तर': 69,
    'सत्तर': 70, 'एकाहत्तर': 71, 'बाहत्तर': 72, 'त्र्याहत्तर': 73, 'चौऱ्याहत्तर': 74,
    'पंच्याहत्तर': 75, 'शहात्तर': 76, 'सत्याहत्तर': 77, 'अठ्याहत्तर': 78, 'एकोणऐंशी': 79,
    'ऐंशी': 80, 'एक्क्याऐंशी': 81, 'ब्याऐंशी': 82, 'त्र्याऐंशी': 83, 'चौऱ्याऐंशी': 84,
    'पंच्याऐंशी': 85, 'शहाऐंशी': 86, 'सत्त्याऐंशी': 87, 'अठ्ठ्याऐंशी': 88, 'एकोणनव्वद': 89,
    'नव्वद': 90, 'एक्क्याण्णव': 91, 'ब्याण्णव': 92, 'त्र्याण्णव': 93, 'चौऱ्याण्णव': 94,
    'पंच्याण्णव': 95, 'शहाण्णव': 96, 'सत्त्याण्णव': 97, 'अठ्ठ्याण्णव': 98, 'नव्व्याण्णव': 99,
    'शंभर': 100
};

// English words (for completeness)
const ENGLISH_NUMBERS = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
    'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
    'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
    'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
    'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90, 'hundred': 100
};

/**
 * Parse spoken number from any language to digits
 * Handles: "six five" -> "65", "छह पांच" -> "65", "सहा पाच" -> "65"
 * @param {string} text - Spoken text containing numbers
 * @param {string} language - Language code (en-US, hi-IN, mr-IN)
 * @returns {string} Extracted number as string
 */
export const parseSpokenNumber = (text, language = 'en-US') => {
    if (!text) return '';

    const cleanText = text.trim().toLowerCase();

    // First try to extract direct digits
    const digitMatch = cleanText.match(/\d+/g);
    if (digitMatch) {
        return digitMatch.join('');
    }

    // Select the appropriate dictionary
    let numberDict = ENGLISH_NUMBERS;
    if (language === 'hi-IN') {
        numberDict = { ...ENGLISH_NUMBERS, ...HINDI_NUMBERS };
    } else if (language === 'mr-IN') {
        numberDict = { ...ENGLISH_NUMBERS, ...MARATHI_NUMBERS };
    } else {
        numberDict = { ...ENGLISH_NUMBERS, ...HINDI_NUMBERS, ...MARATHI_NUMBERS };
    }

    // Try to find a full number match first
    for (const [word, num] of Object.entries(numberDict)) {
        if (cleanText === word || cleanText.includes(word)) {
            // If it's a full match like "पचास" (50), return it
            if (cleanText === word) {
                return String(num);
            }
        }
    }

    // Split text and parse individual words/digits
    const words = cleanText.split(/[\s,]+/);
    let result = '';

    for (const word of words) {
        // Check if word is a digit already
        if (/^\d+$/.test(word)) {
            result += word;
            continue;
        }

        // Check number dictionaries
        const foundNumber = numberDict[word];
        if (foundNumber !== undefined) {
            // For single digits (0-9), just append
            if (foundNumber < 10) {
                result += foundNumber;
            } else {
                // For larger numbers, if result already has content, this might be combining
                // e.g., "twenty five" should be 25
                result += foundNumber;
            }
        }
    }

    return result;
};

/**
 * Parse age from spoken text
 * Supports two-digit spoken format like "six five" meaning 65
 * @param {string} text - Spoken age
 * @param {string} language - Language code
 * @returns {string} Age as number string
 */
export const parseSpokenAge = (text, language = 'en-US') => {
    const parsed = parseSpokenNumber(text, language);

    // Validate age range (1-120)
    const age = parseInt(parsed, 10);
    if (!isNaN(age) && age >= 1 && age <= 120) {
        return String(age);
    }

    return parsed || text;
};

/**
 * Parse phone number from spoken text
 * Handles digit-by-digit or grouped pronunciation
 * @param {string} text - Spoken phone number
 * @param {string} language - Language code
 * @returns {string} Phone number (digits only)
 */
export const parseSpokenPhone = (text, language = 'en-US') => {
    const parsed = parseSpokenNumber(text, language);

    // Remove any non-digit characters
    const digits = parsed.replace(/\D/g, '');

    return digits;
};
