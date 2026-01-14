import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    // Language state - persistent via localStorage (default: Hindi)
    const [language, setLanguageState] = useState(() => {
        return localStorage.getItem('saarthi_language') || 'hi-IN';
    });

    // User data - persistent via localStorage
    const [user, setUserState] = useState(() => {
        const savedUser = localStorage.getItem('saarthi_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // Current page content for "Repeat" voice command
    const [currentPageContent, setCurrentPageContent] = useState('');

    // Update language and persist
    const setLanguage = (lang) => {
        setLanguageState(lang);
        localStorage.setItem('saarthi_language', lang);
    };

    // Save user data and persist
    const saveUser = (userData) => {
        setUserState(userData);
        localStorage.setItem('saarthi_user', JSON.stringify(userData));
    };

    // Clear user data
    const clearUser = () => {
        setUserState(null);
        localStorage.removeItem('saarthi_user');
    };

    // Get language display name
    const getLanguageName = () => {
        const names = {
            'en-US': 'English',
            'hi-IN': 'हिंदी',
            'mr-IN': 'मराठी'
        };
        return names[language] || 'English';
    };

    const value = {
        language,
        setLanguage,
        getLanguageName,
        user,
        saveUser,
        clearUser,
        currentPageContent,
        setCurrentPageContent,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
