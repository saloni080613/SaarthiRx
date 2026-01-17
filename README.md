# SaarthiRx - Voice-First Healthcare Companion

A React-based healthcare application designed specifically for elderly users, featuring voice navigation, haptic feedback, and AI-driven prescription simplification.

## 🎯 Features

- **Voice-First Interface**: Complete voice navigation using Web Speech API
- **Multi-Language Support**: English, Hindi (hi-IN), and Marathi (mr-IN)
- **Large Touch Targets**: Minimum 80px height buttons optimized for elderly users
- **Haptic Feedback**: Vibration feedback on all interactions
- **Conversational Registration**: WhatsApp-style chat interface for user onboarding
- **Prescription Simplification**: Visual medicine details with auto-read instructions
- **Persistent Reminders**: Continuous alerts with vibration and voice loops
- **Accessibility-First**: High contrast, large fonts (24px min body, 32px headers)

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Modern web browser with Web Speech API support (Chrome recommended)
- Mobile device for full haptic feedback experience (optional)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

The app will be available at `http://localhost:5173`

## 🎨 Design System

### Colors
- **Primary**: Safety Orange (#FF8C00)
- **Background**: Warm gradient (#FDFCF0 to #FFF5E6)
- **Text**: Dark gray (#2D3748) for primary, lighter gray for secondary

### Typography
- Body text: Minimum 24px
- Headers: 32px - 48px
- All fonts optimized for readability

### Touch Targets
- Standard buttons: 80px minimum height
- Voice mic button: 150px diameter
- Ample padding and spacing throughout

## 📱 Voice Commands

Global voice commands work across all screens:
- **"Home"** - Navigate to dashboard
- **"Scan"** - Open prescription scanner
- **"Repeat"** - Re-read current page content

Language-specific commands supported in English, Hindi, and Marathi.

## 🗂️ Project Structure

```
src/
├── components/
│   ├── MicButton.jsx          # Reusable microphone input button
│   └── VoiceNavigation.jsx    # Global voice command wrapper
├── pages/
│   ├── Welcome.jsx             # Language selection screen
│   ├── Register.jsx            # Conversational user registration
│   ├── Dashboard.jsx           # Main dashboard
│   ├── PrescriptionView.jsx    # Medicine details view
│   └── Reminder.jsx            # Persistent reminder overlay
├── context/
│   └── AppContext.jsx          # Global state management
├── hooks/
│   └── useVoice.js             # Web Speech API hook
├── utils/
│   └── haptics.js              # Haptic feedback utilities
├── App.jsx                     # Main app with routing
└── main.jsx                    # Entry point
```

## 🔧 Technical Stack

- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom configuration
- **Voice**: Web Speech API (Recognition + Synthesis)
- **Storage**: localStorage for user data persistence
- **Haptics**: Vibration API

## 🎙️ Voice Features

### Speech Recognition
- Continuous listening mode
- Multi-language support (en-US, hi-IN, mr-IN)
- Command parsing for navigation
- Context-aware voice input

### Text-to-Speech
- Slower speech rate (0.9x) for elderly users
- Language-specific voice selection
- Auto-announcement on page transitions
- Accessible confirmation dialogs

## 📝 Usage Flow

1. **Welcome Screen**: Select preferred language
2. **Registration**: Answer voice-prompted questions (name, phone, age, gender)
3. **Dashboard**: Access main features (scan prescription, view medicines, set reminders)
4. **Prescription View**: See simplified medicine instructions with auto-read
5. **Reminders**: Receive persistent alerts at medicine time

## 🌐 Browser Support

Best experience in:
- Chrome/Edge (full Web Speech API support)
- Android Chrome (includes haptic feedback)
- iOS Safari (limited haptic support)

## ⚠️ Notes

- This is a workshop/demo version without backend authentication
- User data stored in localStorage only
- Prescription data is currently mocked (designed for Gemini AI integration)
- Haptic feedback requires mobile device or compatible hardware

## 🎯 Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- High color contrast ratios
- Focus indicators on all focusable elements
- Screen reader friendly markup

## 📄 License

This project is created for educational/workshop purposes.

---

**SaarthiRx** - Making healthcare accessible for everyone 🏥💙
