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
 * Parse frequency codes to actual time slots
 * Handles: OD, BD, TDS, QID, 1-1-1, 1-0-1, etc.
 */
const parseFrequencyToTimes = (frequency) => {
    if (!frequency) return { times: ['morning'], timesPerDay: 1 };
    
    const freq = frequency.toString().toUpperCase().trim();
    
    const patterns = {
        // Standard medical abbreviations
        'OD': { times: ['morning'], timesPerDay: 1 },
        'ONCE DAILY': { times: ['morning'], timesPerDay: 1 },
        'BD': { times: ['morning', 'night'], timesPerDay: 2 },
        'TWICE DAILY': { times: ['morning', 'night'], timesPerDay: 2 },
        'TDS': { times: ['morning', 'afternoon', 'night'], timesPerDay: 3 },
        'THREE TIMES': { times: ['morning', 'afternoon', 'night'], timesPerDay: 3 },
        'TID': { times: ['morning', 'afternoon', 'night'], timesPerDay: 3 },
        'QID': { times: ['morning', 'afternoon', 'evening', 'night'], timesPerDay: 4 },
        'FOUR TIMES': { times: ['morning', 'afternoon', 'evening', 'night'], timesPerDay: 4 },
        'QHS': { times: ['night'], timesPerDay: 1 },
        'HS': { times: ['night'], timesPerDay: 1 },
        'AT NIGHT': { times: ['night'], timesPerDay: 1 },
        'MORNING': { times: ['morning'], timesPerDay: 1 },
        
        // Indian prescription patterns (1-1-1 format)
        '1-1-1': { times: ['morning', 'afternoon', 'night'], timesPerDay: 3 },
        '1-0-1': { times: ['morning', 'night'], timesPerDay: 2 },
        '0-0-1': { times: ['night'], timesPerDay: 1 },
        '1-0-0': { times: ['morning'], timesPerDay: 1 },
        '0-1-0': { times: ['afternoon'], timesPerDay: 1 },
        '1-1-0': { times: ['morning', 'afternoon'], timesPerDay: 2 },
        '0-1-1': { times: ['afternoon', 'night'], timesPerDay: 2 },
        '1-1-1-1': { times: ['morning', 'afternoon', 'evening', 'night'], timesPerDay: 4 },
    };
    
    // Direct match
    if (patterns[freq]) return patterns[freq];
    
    // Check if contains any pattern
    for (const [pattern, result] of Object.entries(patterns)) {
        if (freq.includes(pattern)) return result;
    }
    
    // Try to extract from "X times" format
    const timesMatch = freq.match(/(\d+)\s*TIMES?/i);
    if (timesMatch) {
        const count = parseInt(timesMatch[1]);
        if (count === 1) return { times: ['morning'], timesPerDay: 1 };
        if (count === 2) return { times: ['morning', 'night'], timesPerDay: 2 };
        if (count === 3) return { times: ['morning', 'afternoon', 'night'], timesPerDay: 3 };
        if (count >= 4) return { times: ['morning', 'afternoon', 'evening', 'night'], timesPerDay: 4 };
    }
    
    // Default fallback
    return { times: ['morning'], timesPerDay: 1 };
};

/**
 * Default reminder times for each slot
 */
const DEFAULT_TIMES = {
    morning: '08:00',
    afternoon: '14:00',
    evening: '18:00',
    night: '21:00'
};

/**
 * Analyze prescription image using Gemini AI with STRICT JSON schema
 * @param {string} base64Image - Base64 encoded image
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<object>} Extracted medicine data with parsed frequencies
 */
export const analyzePrescription = async (base64Image, mimeType = 'image/jpeg') => {
    // Models to try in order of preference (January 2026)
    // Each model has its own quota pool, so we try multiple
    const MODELS_TO_TRY = [
        'gemini-2.5-flash',           // Primary - stable since June 2025
        'gemini-1.5-flash',           // Fallback - separate quota pool
        'gemini-1.5-pro',             // Pro fallback - separate quota pool
    ];

    // Strict extraction prompt with explicit JSON schema
    const prompt = `You are an expert medical prescription OCR system for elderly Indian users.

TASK: Analyze this prescription image and extract ALL medicine information.

STRICT OUTPUT FORMAT - Return ONLY this JSON structure:
{
  "medicines": [
    {
      "name": "Medicine Name (generic preferred)",
      "dosage": "5mg, 500mg, etc.",
      "frequency": "EXACT as written: OD, BD, TDS, 1-1-1, 1-0-1, etc.",
      "duration_days": 5,
      "with_food": true,
      "visual_type": "Tablet | Capsule | Syrup | Injection",
      "visual_color": "White | Pink | Blue | Red | Yellow | etc.",
      "special_instructions": "Any specific notes"
    }
  ],
  "doctor_name": "Name if visible",
  "prescription_date": "DD/MM/YYYY if visible",
  "missing_info": ["List fields that were unclear or missing"]
}

CRITICAL RULES:
1. frequency MUST be extracted exactly as written (OD, BD, TDS, 1-1-1, 1-0-1, etc.)
2. duration_days MUST be a number. If not specified, use 5 as default.
3. visual_type and visual_color help elderly identify their pills
4. Extract ALL medicines - do not skip any
5. Return ONLY valid JSON, no markdown or explanation`;

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
            const rawData = JSON.parse(text);

            console.log(`✅ Success with model: ${modelName}`);
            console.log('📋 Raw Gemini extraction:', rawData);

            // Post-process medicines with frequency parsing
            const processedMedicines = (rawData.medicines || []).map(med => {
                const frequencyInfo = parseFrequencyToTimes(med.frequency);
                
                return {
                    name: med.name || 'Unknown Medicine',
                    dosage: med.dosage || '',
                    frequency: med.frequency || 'OD',
                    timing: frequencyInfo.times,
                    timesPerDay: frequencyInfo.timesPerDay,
                    reminderTimes: frequencyInfo.times.map(t => DEFAULT_TIMES[t]),
                    durationDays: med.duration_days || 5,
                    withFood: med.with_food ?? true,
                    visualType: med.visual_type || 'Tablet',
                    visualColor: med.visual_color || 'White',
                    visualDescription: `${med.visual_color || 'White'} ${med.visual_type || 'Tablet'}`.trim(),
                    specialInstructions: med.special_instructions || '',
                    // Track if duration was explicitly set or defaulted
                    durationWasGuessed: !med.duration_days
                };
            });

            const processedData = {
                medicines: processedMedicines,
                doctorName: rawData.doctor_name || null,
                date: rawData.prescription_date || null,
                missingInfo: rawData.missing_info || [],
                // Flag if any medicine needs duration confirmation
                needsDurationConfirmation: processedMedicines.some(m => m.durationWasGuessed)
            };

            console.log('📋 Processed prescription:', processedData);
            return { success: true, data: processedData };

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
 * Analyze a photo of actual medicine (pill/bottle/blister pack)
 * Used for Visual Verifier feature - helps elderly identify their medicines
 * @param {string} base64Image - Base64 encoded image of the medicine
 * @param {string} mimeType - Image MIME type
 * @param {string} expectedMedicine - Medicine name from prescription (optional)
 * @returns {Promise<object>} Visual details and expiry information
 */
export const analyzeMedicinePhoto = async (base64Image, mimeType = 'image/jpeg', expectedMedicine = null) => {
    const MODELS_TO_TRY = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
    ];

    const prompt = `You are analyzing a photo of medicine (tablet, capsule, syrup, or packaging).

TASK: Extract visual identification details and expiry information.

${expectedMedicine ? `EXPECTED MEDICINE: ${expectedMedicine}` : ''}

STRICT OUTPUT FORMAT - Return ONLY this JSON:
{
    "expiry_date": "MM/YYYY format if visible, null if not",
    "visual_description": "Detailed description (e.g., 'Small round pink tablet with 'A' engraving')",
    "shape": "Round | Oval | Oblong | Square | Capsule",
    "color": "Primary color (e.g., Pink, White, Blue)",
    "size": "Small | Medium | Large",
    "medicine_type": "Tablet | Capsule | Syrup | Injection | Cream | Drops",
    "packaging_text": "Any medicine name visible on packaging",
    "matches_expected": ${expectedMedicine ? 'true or false based on whether this looks like the expected medicine' : 'null'}
}

Return ONLY valid JSON, no explanation.`;

    for (const modelName of MODELS_TO_TRY) {
        try {
            console.log(`🔍 Analyzing medicine photo with: ${modelName}`);
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
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            const data = JSON.parse(text);
            console.log('💊 Medicine photo analysis:', data);

            return {
                success: true,
                data: {
                    expiryDate: data.expiry_date,
                    visualDescription: data.visual_description,
                    shape: data.shape,
                    color: data.color,
                    size: data.size,
                    medicineType: data.medicine_type,
                    packagingText: data.packaging_text,
                    matchesExpected: data.matches_expected
                }
            };

        } catch (error) {
            console.warn(`⚠️ Medicine photo analysis failed with ${modelName}:`, error.message);
            continue;
        }
    }

    return {
        success: false,
        error: 'Could not analyze the medicine photo. Please try again with a clearer image.',
        data: null
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
