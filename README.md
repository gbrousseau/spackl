# Spackl

Spackl is a cross-platform mobile application built with Expo and React Native. It enables users to manage contacts, share calendars, and collaborate efficiently. The app supports both iOS, Android, and Web platforms, leveraging Expo's powerful ecosystem and Firebase for backend services.

## Features

- Contact management with search and group support
- Calendar sharing and event management
- Real-time updates using Firebase
- Expo Router for navigation
- Platform-specific optimizations (iOS, Android, Web)
- Modern UI with theming and dark mode
- Push notifications and SMS invites
- Integration with device features (contacts, calendar, haptics, etc.)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd spackl
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in your Firebase and other API keys as needed.

## Usage

### Start the development server

```bash
npm start
# or
yarn start
```

- Use the Expo Go app on your device to scan the QR code, or run on an emulator/simulator.

### Web Support

```bash
npm run web
# or
yarn web
```

### Android/iOS

```bash
npm run android
npm run ios
```

## Development

- **Expo Router** is used for navigation. See the `/app` directory for route structure.
- **Firebase** is used for authentication, data storage, and notifications. Configure your Firebase project in `firebaseConfig.ts`.
- **Ngrok** can be used for tunneling if you need to test webhooks or external integrations.
- **TypeScript** is used throughout the project for type safety.

## Troubleshooting

- If you encounter dependency or compatibility issues, ensure your dependencies match the versions in `package.json`.
- Clear caches with:
  ```bash
  npx expo start -c
  ```
- For web issues, ensure `react-native-web` and related packages are installed.
- For Firebase issues, check your `.env` configuration.

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your branch and open a Pull Request

## License

MIT

---

For more information, see the Expo and React Native documentation.