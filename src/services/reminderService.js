/**
 * Reminder Service
 * Manages medication reminders with localStorage persistence
 */

const STORAGE_KEY = 'saarthirx_reminders';

/**
 * Generate a unique ID for reminders
 */
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Get all reminders from storage
 * @returns {Array} Array of reminder objects
 */
export const getReminders = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading reminders:', error);
        return [];
    }
};

/**
 * Save reminders to storage
 * @param {Array} reminders - Array of reminder objects
 */
const saveReminders = (reminders) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
    } catch (error) {
        console.error('Error saving reminders:', error);
    }
};

/**
 * Add a new reminder
 * @param {Object} reminder - Reminder data (without id)
 * @returns {Object} The created reminder with id
 */
export const addReminder = (reminder) => {
    const reminders = getReminders();
    const newReminder = {
        id: generateId(),
        medicineName: reminder.medicineName || 'Medicine',
        description: reminder.description || '',
        color: reminder.color || '#3B82F6',
        time: reminder.time || '08:00',
        enabled: reminder.enabled !== undefined ? reminder.enabled : true,
        repeatDays: reminder.repeatDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        createdAt: new Date().toISOString()
    };
    reminders.push(newReminder);
    saveReminders(reminders);
    return newReminder;
};

/**
 * Update an existing reminder
 * @param {string} id - Reminder ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated reminder or null if not found
 */
export const updateReminder = (id, updates) => {
    const reminders = getReminders();
    const index = reminders.findIndex(r => r.id === id);

    if (index === -1) {
        console.error('Reminder not found:', id);
        return null;
    }

    reminders[index] = {
        ...reminders[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    saveReminders(reminders);
    return reminders[index];
};

/**
 * Delete a reminder
 * @param {string} id - Reminder ID
 * @returns {boolean} Success status
 */
export const deleteReminder = (id) => {
    const reminders = getReminders();
    const filtered = reminders.filter(r => r.id !== id);

    if (filtered.length === reminders.length) {
        console.error('Reminder not found:', id);
        return false;
    }

    saveReminders(filtered);
    return true;
};

/**
 * Toggle reminder enabled state
 * @param {string} id - Reminder ID
 * @returns {Object|null} Updated reminder or null if not found
 */
export const toggleReminder = (id) => {
    const reminders = getReminders();
    const reminder = reminders.find(r => r.id === id);

    if (!reminder) {
        console.error('Reminder not found:', id);
        return null;
    }

    return updateReminder(id, { enabled: !reminder.enabled });
};

/**
 * Get a single reminder by ID
 * @param {string} id - Reminder ID
 * @returns {Object|null} Reminder or null if not found
 */
export const getReminderById = (id) => {
    const reminders = getReminders();
    return reminders.find(r => r.id === id) || null;
};

/**
 * Get reminders for a specific time
 * @param {string} time - Time in HH:MM format
 * @returns {Array} Array of matching reminders
 */
export const getRemindersForTime = (time) => {
    const reminders = getReminders();
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = dayNames[now.getDay()];

    return reminders.filter(r =>
        r.enabled &&
        r.time === time &&
        r.repeatDays.includes(today)
    );
};

/**
 * Format time for display (12-hour format)
 * @param {string} time - Time in HH:MM format
 * @returns {string} Formatted time like "8:00 AM"
 */
export const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Get time period label
 * @param {string} time - Time in HH:MM format
 * @returns {string} Period label (Morning, Afternoon, Evening, Night)
 */
export const getTimePeriod = (time) => {
    if (!time) return '';
    const hours = parseInt(time.split(':')[0], 10);

    if (hours >= 5 && hours < 12) return 'Morning';
    if (hours >= 12 && hours < 17) return 'Afternoon';
    if (hours >= 17 && hours < 21) return 'Evening';
    return 'Night';
};

/**
 * Pill color options for the UI
 */
export const PILL_COLORS = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Orange', value: '#F97316' },
    { name: 'White', value: '#F3F4F6' }
];

/**
 * Quick time presets
 */
export const TIME_PRESETS = [
    { label: 'Morning', time: '08:00', icon: '🌅' },
    { label: 'Afternoon', time: '13:00', icon: '☀️' },
    { label: 'Evening', time: '18:00', icon: '🌆' },
    { label: 'Night', time: '21:00', icon: '🌙' }
];

/**
 * Days of the week
 */
export const DAYS_OF_WEEK = [
    { short: 'Sun', full: 'Sunday' },
    { short: 'Mon', full: 'Monday' },
    { short: 'Tue', full: 'Tuesday' },
    { short: 'Wed', full: 'Wednesday' },
    { short: 'Thu', full: 'Thursday' },
    { short: 'Fri', full: 'Friday' },
    { short: 'Sat', full: 'Saturday' }
];
