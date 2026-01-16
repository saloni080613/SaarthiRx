/**
 * Demo Data Loader
 * Populates localStorage with sample medicines and reminders for testing
 * Use this when Gemini API is unavailable
 */

// Sample medicines with visual descriptions
const DEMO_MEDICINES = [
    {
        id: 'demo-1',
        name: 'Amlodipine',
        dosage: '5mg',
        timing: ['morning'],
        frequency: 'Once daily',
        durationDays: 30,
        withFood: false,
        visualType: 'Tablet',
        visualColor: 'white',
        visualDescription: 'Small white round tablet',
        specialInstructions: 'Take on empty stomach',
        quantity: 28,
        addedAt: Date.now(),
        prescriptionDate: new Date().toISOString()
    },
    {
        id: 'demo-2',
        name: 'Metformin',
        dosage: '500mg',
        timing: ['morning', 'night'],
        frequency: 'Twice daily',
        durationDays: 30,
        withFood: true,
        visualType: 'Tablet',
        visualColor: 'white',
        visualDescription: 'Oval white tablet with marking',
        specialInstructions: 'Take with meals',
        quantity: 56,
        addedAt: Date.now(),
        prescriptionDate: new Date().toISOString()
    },
    {
        id: 'demo-3',
        name: 'Paracetamol',
        dosage: '650mg',
        timing: ['morning', 'afternoon', 'night'],
        frequency: 'Three times daily',
        durationDays: 7,
        withFood: false,
        visualType: 'Tablet',
        visualColor: 'yellow',
        visualDescription: 'Yellow round tablet',
        specialInstructions: 'Take for fever or pain',
        quantity: 15,
        addedAt: Date.now(),
        prescriptionDate: new Date().toISOString()
    },
    {
        id: 'demo-4',
        name: 'Vitamin D3',
        dosage: '60000 IU',
        timing: ['morning'],
        frequency: 'Once weekly',
        durationDays: 60,
        withFood: true,
        visualType: 'Capsule',
        visualColor: 'orange',
        visualDescription: 'Orange soft gel capsule',
        specialInstructions: 'Take with fatty meal for better absorption',
        quantity: 8,
        addedAt: Date.now(),
        prescriptionDate: new Date().toISOString()
    },
    {
        id: 'demo-5',
        name: 'Aspirin',
        dosage: '75mg',
        timing: ['morning'],
        frequency: 'Once daily',
        durationDays: 30,
        withFood: true,
        visualType: 'Tablet',
        visualColor: 'pink',
        visualDescription: 'Small pink coated tablet',
        specialInstructions: 'Blood thinner - take after breakfast',
        quantity: 2, // Low stock for testing alert
        addedAt: Date.now(),
        prescriptionDate: new Date().toISOString()
    }
];

// Sample reminders
const DEMO_REMINDERS = [
    {
        id: 'rem-1',
        medicineName: 'Amlodipine',
        description: '5mg - Small white round tablet',
        color: '#3B82F6',
        time: '09:00',
        nextFireTime: getTomorrowTime(9, 0),
        nextFireHour: 9,
        nextFireMinute: 0,
        enabled: true,
        repeatDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        createdAt: new Date().toISOString()
    },
    {
        id: 'rem-2',
        medicineName: 'Metformin',
        description: '500mg - Oval white tablet',
        color: '#10B981',
        time: '09:00',
        nextFireTime: getTomorrowTime(9, 0),
        nextFireHour: 9,
        nextFireMinute: 0,
        enabled: true,
        repeatDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        createdAt: new Date().toISOString()
    },
    {
        id: 'rem-3',
        medicineName: 'Metformin',
        description: '500mg - Oval white tablet',
        color: '#10B981',
        time: '21:00',
        nextFireTime: getTomorrowTime(21, 0),
        nextFireHour: 21,
        nextFireMinute: 0,
        enabled: true,
        repeatDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        createdAt: new Date().toISOString()
    },
    {
        id: 'rem-4',
        medicineName: 'Aspirin',
        description: '75mg - Small pink tablet',
        color: '#EC4899',
        time: '09:00',
        nextFireTime: getTomorrowTime(9, 0),
        nextFireHour: 9,
        nextFireMinute: 0,
        enabled: true,
        repeatDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        createdAt: new Date().toISOString()
    }
];

function getTomorrowTime(hours, minutes) {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    if (date <= new Date()) {
        date.setDate(date.getDate() + 1);
    }
    return date.toISOString();
}

/**
 * Load demo data into localStorage
 * Call this from browser console: loadDemoData()
 */
export function loadDemoData() {
    // Save demo medicines
    localStorage.setItem('saarthi_medicines', JSON.stringify(DEMO_MEDICINES));
    
    // Save demo reminders
    localStorage.setItem('saarthirx_reminders', JSON.stringify(DEMO_REMINDERS));
    
    console.log('✅ Demo data loaded!');
    console.log(`   📦 ${DEMO_MEDICINES.length} medicines added`);
    console.log(`   ⏰ ${DEMO_REMINDERS.length} reminders added`);
    console.log('   🔄 Reloading page to apply changes...');
    
    setTimeout(() => window.location.reload(), 1000);
    
    return { medicines: DEMO_MEDICINES, reminders: DEMO_REMINDERS };
}

/**
 * Clear all demo data
 */
export function clearDemoData() {
    localStorage.removeItem('saarthi_medicines');
    localStorage.removeItem('saarthirx_reminders');
    console.log('🧹 Demo data cleared!');
    console.log('   🔄 Reloading page to apply changes...');
    
    setTimeout(() => window.location.reload(), 1000);
}

// Make available globally for console access
if (typeof window !== 'undefined') {
    window.loadDemoData = loadDemoData;
    window.clearDemoData = clearDemoData;
}

export default { loadDemoData, clearDemoData, DEMO_MEDICINES, DEMO_REMINDERS };
