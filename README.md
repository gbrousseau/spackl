# Spackl

A modern social calendar app built with React Native and Expo, featuring Firebase authentication, Google Sign-in, and real-time event management.

## Features

- 🔐 Authentication
  - Email/Password sign-in and registration
  - Google Sign-in integration
  - Persistent authentication state
- 📅 Calendar Management
  - View and manage events
  - Create new events with detailed information
  - Invite contacts to events
- 👥 Contact Management
  - Manage your contacts
  - Import contacts from device
  - Search and filter functionality
- 🎨 Theme Support
  - Light/Dark mode
  - Modern UI with Tailwind-inspired design
- 📱 Cross-Platform
  - iOS and Android support
  - Web support with responsive design

## Tech Stack

- **Framework**: React Native + Expo
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **State Management**: React Context
- **Navigation**: Expo Router
- **UI Components**: Custom components with Tailwind-inspired styling
- **Icons**: Lucide React Native
- **Calendar**: Expo Calendar
- **Contacts**: Expo Contacts

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio & Android SDK (for Android development)

### Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID=your_web_client_id
EXPO_PUBLIC_FIREBASE_IOS_CLIENT_ID=your_ios_client_id
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/gbrousseau/spackl.git
cd spackl
```

2. Install dependencies:
```bash
npm install
```

3. Install native dependencies:
```bash
expo prebuild
```

4. Start the development server:
```bash
# For iOS
expo run:ios

# For Android
expo run:android
```

## Project Structure

```
spackl/
├── app/                    # Main application code
│   ├── (tabs)/            # Tab-based navigation screens
│   ├── _layout.tsx        # Root layout configuration
│   └── welcome.tsx        # Authentication screen
├── components/            # Reusable UI components
├── config/               # Configuration files
│   └── firebase.ts      # Firebase initialization
├── context/             # React Context providers
│   ├── AuthContext.tsx  # Authentication context
│   ├── ThemeContext.tsx # Theme context
│   └── ...
├── utils/              # Helper functions and utilities
└── types/             # TypeScript type definitions
```

## Development

### Running the App

- **iOS Simulator**: `expo run:ios`
- **Android Emulator**: `expo run:android`
- **Web**: `expo start --web`

### Building for Production

1. Configure EAS Build:
```bash
eas build:configure
```

2. Create a production build:
```bash
# For iOS
eas build --platform ios --profile production

# For Android
eas build --platform android --profile production
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Expo](https://expo.dev/) for the amazing development platform
- [Firebase](https://firebase.google.com/) for authentication and database services
- [React Native](https://reactnative.dev/) for the core framework
- [Lucide](https://lucide.dev/) for the beautiful icons
