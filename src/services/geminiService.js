/**
 * Gemini AI Service for Prescription Analysis
 * Uses Google's Gemini 1.5 Flash for prescription OCR and drug interaction checks
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Known dangerous drug combinations (Phase 5: Safety Shield)
const DANGEROUS_COMBOS = [
    { drugs: ['aspirin', 'clopidogrel'], warning: 'Blood thinners - increased bleeding risk' },
    { drugs: ['aspirin', 'warfarin'], warning: 'Blood thinners - serious bleeding risk' },
    { drugs: ['warfarin', 'ibuprofen'], warning: 'Increased bleeding risk' },
    { drugs: ['warfarin', 'aspirin'], warning: 'Major bleeding risk' },
    { drugs: ['metformin', 'alcohol'], warning: 'Low blood sugar risk' },
    { drugs: ['lisinopril', 'potassium'], warning: 'High potassium levels' },
    { drugs: ['simvastatin', 'grapefruit'], warning: 'Muscle damage risk' },
    { drugs: ['methotrexate', 'nsaid'], warning: 'Kidney damage risk' },
    { drugs: ['digoxin', 'amiodarone'], warning: 'Heart rhythm problems' },
];

/**
 * Analyze prescription image using Gemini AI
 * Tries multiple models with fallback for better reliability
 * @param {string} base64Image - Base64 encoded image
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<object>} Extracted medicine data
 */
export const analyzePrescription = async (base64Image, mimeType = 'image/jpeg') => {
    // Models to try in order of preference (updated Jan 2025)
    // Note: gemini-1.x and gemini-pro-vision are deprecated, use 2.x models
    const MODELS_TO_TRY = [
        'gemini-2.5-flash',         // Fast multimodal model (recommended)
        'gemini-2.0-flash-exp',     // Experimental 2.0 version
        'gemini-2.5-pro',           // Powerful reasoning model
        'gemini-1.5-flash',         // Fallback (may still work)
    ];

    const prompt = `You are a medical prescription reader for elderly Indian users.

Analyze this prescription image and extract ALL medicine information.

Return ONLY a valid JSON object with this exact structure:
{
  "medicines": [
    {
      "name": "Medicine Name (generic name preferred)",
      "dosage": "e.g., 5mg, 500mg",
      "frequency": "e.g., twice daily, once daily",
      "timing": ["morning", "afternoon", "evening", "night"],
      "withFood": true or false,
      "duration": "e.g., 7 days, 2 weeks",
      "visualDescription": "Describe pill appearance: color, shape, size"
    }
  ],
  "doctorName": "Doctor name if visible",
  "date": "Prescription date if visible",
  "specialInstructions": "Any special notes"
}

IMPORTANT:
- Extract ALL medicines visible in the prescription
- For timing, use: "morning" (6-9 AM), "afternoon" (12-2 PM), "evening" (5-7 PM), "night" (9-11 PM)
- Common abbreviations: OD=once daily, BD=twice daily, TDS=three times, QID=four times
- If information is unclear, use reasonable defaults
- Return ONLY the JSON, no markdown or explanation`;

    let lastError = null;

    for (const modelName of MODELS_TO_TRY) {
        try {
            console.log(`🔄 Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        mimeType,
                        data: base64Image
                    }
                }
            ]);

            const response = await result.response;
            let text = response.text();

            // Clean up response - remove markdown code blocks if present
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            // Parse JSON
            const data = JSON.parse(text);

            console.log(`✅ Success with model: ${modelName}`);
            console.log('📋 Gemini extracted prescription:', data);
            return { success: true, data };

        } catch (error) {
            console.warn(`⚠️ Model ${modelName} failed:`, error.message);
            lastError = error;

            // If quota exhausted, try next model
            if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
                continue;
            }

            // If it's a different error, still try next model
            continue;
        }
    }

    // All models failed
    console.error('❌ All Gemini models failed:', lastError);

    // Check if it's a quota issue
    const isQuotaError = lastError?.message?.includes('429') ||
        lastError?.message?.includes('quota') ||
        lastError?.message?.includes('RESOURCE_EXHAUSTED');

    return {
        success: false,
        error: isQuotaError
            ? 'AI service is temporarily busy. Please try again in a few minutes.'
            : (lastError?.message || 'Failed to analyze prescription'),
        data: null,
        isQuotaError
    };
};

/**
 * Check for dangerous drug interactions
 * @param {array} newMedicines - Newly scanned medicines
 * @param {array} existingMedicines - User's saved medicine history
 * @returns {array} List of conflicts with warnings
 */
export const checkDrugInteractions = (newMedicines, existingMedicines = []) => {
    const conflicts = [];
    const allDrugs = [
        ...newMedicines.map(m => m.name.toLowerCase()),
        ...existingMedicines.map(m => m.name.toLowerCase())
    ];

    DANGEROUS_COMBOS.forEach(combo => {
        const [drug1, drug2] = combo.drugs;
        const hasDrug1 = allDrugs.some(d => d.includes(drug1));
        const hasDrug2 = allDrugs.some(d => d.includes(drug2));

        if (hasDrug1 && hasDrug2) {
            conflicts.push({
                drug1,
                drug2,
                warning: combo.warning,
                severity: 'HIGH'
            });
        }
    });

    return conflicts;
};

/**
 * Generate voice-friendly summary of medicines
 * @param {array} medicines - Medicine list
 * @param {string} language - Language code
 * @returns {string} TTS-ready summary
 */
export const generateVoiceSummary = (medicines, language = 'hi-IN') => {
    if (!medicines || medicines.length === 0) {
        const noMeds = {
            'en-US': 'I could not find any medicines in this prescription.',
            'hi-IN': 'मुझे इस पर्चे में कोई दवाई नहीं मिली।',
            'mr-IN': 'मला या प्रिस्क्रिप्शनमध्ये कोणतीही औषधे सापडली नाहीत.'
        };
        return noMeds[language] || noMeds['hi-IN'];
    }

    const count = medicines.length;
    const templates = {
        'en-US': {
            found: `I found ${count} medicine${count > 1 ? 's' : ''}.`,
            morning: 'for morning',
            afternoon: 'for afternoon',
            evening: 'for evening',
            night: 'for night'
        },
        'hi-IN': {
            found: `मुझे ${count} दवाई${count > 1 ? 'यां' : ''} मिली${count > 1 ? 'ं' : ''}।`,
            morning: 'सुबह के लिए',
            afternoon: 'दोपहर के लिए',
            evening: 'शाम के लिए',
            night: 'रात के लिए'
        },
        'mr-IN': {
            found: `मला ${count} औषध${count > 1 ? 'े' : ''} सापडल${count > 1 ? 'ी' : 'े'}.`,
            morning: 'सकाळसाठी',
            afternoon: 'दुपारसाठी',
            evening: 'संध्याकाळसाठी',
            night: 'रात्रीसाठी'
        }
    };

    const t = templates[language] || templates['hi-IN'];
    let summary = t.found + ' ';

    medicines.forEach((med, i) => {
        const timing = med.timing?.[0] || 'morning';
        const timingText = t[timing] || t.morning;
        summary += `${med.name} ${timingText}`;
        if (i < medicines.length - 1) summary += ', ';
    });

    summary += '.';
    return summary;
};

/**
 * Generate conflict warning message
 * @param {array} conflicts - List of drug conflicts
 * @param {string} language - Language code
 * @returns {string} Warning message for TTS
 */
export const generateConflictWarning = (conflicts, language = 'hi-IN') => {
    if (!conflicts || conflicts.length === 0) return null;

    const conflict = conflicts[0]; // Most severe
    const templates = {
        'en-US': `Warning! Please be careful. You are already taking a blood thinner. ${conflict.warning}. Consult your doctor before adding this new medicine.`,
        'hi-IN': `चेतावनी! कृपया सावधान रहें। आप पहले से एक खून पतला करने वाली दवा ले रहे हैं। ${conflict.warning}। इस नई दवा को जोड़ने से पहले अपने डॉक्टर से सलाह लें।`,
        'mr-IN': `चेतावनी! कृपया काळजी घ्या. तुम्ही आधीच रक्त पातळ करणारे औषध घेत आहात. ${conflict.warning}. हे नवीन औषध जोडण्यापूर्वी तुमच्या डॉक्टरांचा सल्ला घ्या.`
    };

    return templates[language] || templates['hi-IN'];
};
