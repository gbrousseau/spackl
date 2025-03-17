# Spackl

A modern mobile calendar application built with React Native and Expo, designed to provide a seamless calendar management experience.

## Features

- 📅 Calendar Integration
- 📍 Location Services
- 📱 Contact Management
- 🔔 Push Notifications
- 📱 SMS Integration
- 🌐 Web Browser Support
- 🎨 Modern UI with Blur Effects and Linear Gradients
- 🔒 Secure Data Storage
- 📱 Cross-Platform Support

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/gbrousseau/spackl.git
   cd spackl
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start the Expo development server
- `npm run build:web` - Build the web version of the application
- `npm run lint` - Run linting checks

## Technology Stack

- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **UI Components**: 
  - Expo Vector Icons
  - React Native Reanimated
  - React Native Gesture Handler
- **Data Management**:
  - AsyncStorage
  - Expo Calendar
  - Expo Contacts
- **Location Services**:
  - Expo Location
  - Google Places Autocomplete
- **Notifications**: Expo Notifications
- **Styling**: 
  - Expo Linear Gradient
  - Expo Blur

## Project Structure

```
spackl/
├── app/             # Application screens and navigation
├── components/      # Reusable UI components
├── context/         # React Context providers
├── hooks/          # Custom React hooks
├── assets/         # Static assets (images, fonts)
└── .expo/          # Expo configuration files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Expo](https://expo.dev/)
- Icons from [Expo Vector Icons](https://icons.expo.fyi/)
- Calendar integration using [Expo Calendar](https://docs.expo.dev/versions/latest/sdk/calendar/)