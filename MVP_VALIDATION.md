# Spackl MVP Validation Guide

This document outlines the manual validation steps needed to ensure the MVP is ready for TestFlight/Play Store distribution.

## Phase 1: Security & Configuration ✅ COMPLETE

- [x] Firebase config moved to environment variables (firebaseConfig.ts)
- [x] .env file configured with Expo secrets
- [x] .env.example created for documentation
- [x] app.json configured with EAS project ID, bundle IDs, permissions

**Action if needed:** Verify in .env file that all EXPO_PUBLIC_* variables are set correctly.

---

## Phase 2: Core Feature Validation

### 2.1 Authentication Flow
**To test:** Go through the full auth cycle on simulator/device

- [ ] **Login Screen** (`app/auth/login.tsx`)
  - [ ] Email/password login works
  - [ ] Google Sign-In button appears and is functional
  - [ ] Invalid credentials show error message
  - [ ] Success redirects to home/calendar screen
  - [ ] User info persists in AsyncStorage

- [ ] **Register Screen** (`app/auth/register.tsx`)
  - [ ] Form validation works (required fields, email format)
  - [ ] Password confirmation matches
  - [ ] Submit creates new user in Firebase Auth
  - [ ] New user profile saved to Firestore
  - [ ] Auto-login after registration works

- [ ] **Forgot Password** (`app/auth/forgot-password.tsx`)
  - [ ] Email input works
  - [ ] Password reset email sends successfully
  - [ ] Success message shown to user

---

### 2.2 Calendar Screen
**File:** `app/(tabs)/index.tsx` → redirects to `app/(tabs)/calendar/index.tsx`

- [ ] Calendar grid renders without errors
- [ ] Events from Firestore display on calendar
- [ ] Tapping a date shows events for that day
- [ ] Dark/Light theme toggle affects calendar colors
- [ ] Month navigation works (prev/next month)
- [ ] Current date is highlighted

---

### 2.3 Create Event Flow ⚠️ FOCUS AREA
**Primary File:** `app/(tabs)/calendar/event.tsx` (called via create.tsx redirect)

**Steps to test:**
1. Tap "Create" tab
2. Should redirect to event creation form

- [ ] **Form Loads:**
  - [ ] Title, start date/time, end date/time fields visible
  - [ ] Location autocomplete loads without crashes
  - [ ] Participants section shows empty state with "Add" button

- [ ] **Form Functionality:**
  - [ ] Title input accepts text
  - [ ] Date picker opens and allows date selection
  - [ ] Time picker opens and allows time selection
  - [ ] End time defaults to 1 hour after start time
  - [ ] Location autocomplete:
    - [ ] Shows suggestions as user types
    - [ ] Can select a location from suggestions
    - [ ] Current location button (📍) works (requires location permission)

- [ ] **Participants:**
  - [ ] "Add Participant" button opens contact picker
  - [ ] Contacts from device load (or web mock shows)
  - [ ] Can search contacts by name/email
  - [ ] Selecting contact adds them to participants list
  - [ ] Can remove participant with X button
  - [ ] Participants display with name and email/phone

- [ ] **Form Submission:**
  - [ ] Save button triggers validation
  - [ ] Validates title is not empty
  - [ ] Validates start date < end date
  - [ ] Saves event to local calendar (Expo Calendar API)
  - [ ] Saves event to Firestore with attendees
  - [ ] Shows success feedback (toast/navigation back)
  - [ ] Calendar refreshes to show new event

- [ ] **Error Handling:**
  - [ ] Shows error if calendar permission denied
  - [ ] Shows error if Firebase save fails
  - [ ] User can retry failed submissions

---

### 2.4 Invitations Screen
**File:** `app/(tabs)/invitations.tsx`

- [ ] Page loads without errors
- [ ] Lists pending invitations (if any)
- [ ] Shows event name, date, time, organizer
- [ ] Tapping invitation shows details
- [ ] Can accept/decline invitation
- [ ] Accepted event appears in calendar
- [ ] Empty state shown when no pending invitations

---

### 2.5 Contacts Screen
**File:** `app/(tabs)/contacts.tsx`

- [ ] Contacts load from device (Expo Contacts API) or mock data
- [ ] List displays contact names with email/phone
- [ ] Search works (filter by name)
- [ ] Tapping contact shows detail screen
- [ ] Detail screen shows full contact info
- [ ] Can call/email contact (if implemented)

---

### 2.6 Settings Screen
**File:** `app/(tabs)/settings.tsx`

- [ ] Dark mode toggle works and persists
- [ ] Notification preferences display
- [ ] Can enable/disable notifications
- [ ] Contact sharing settings visible
- [ ] Logout button works
- [ ] After logout, redirected to login screen

---

## Phase 3: Cross-Platform Validation

### iOS (via Simulator or Device)
- [ ] App builds with `eas build --platform ios`
- [ ] TestFlight build uploads successfully
- [ ] App installs and launches on iPhone
- [ ] All above tests pass on iOS
- [ ] Permissions prompts work (Calendar, Contacts, Location)

### Android (via Emulator or Device)
- [ ] App builds with `eas build --platform android`
- [ ] APK/AAB uploads to Play Console
- [ ] App installs and launches on Android
- [ ] All above tests pass on Android
- [ ] Permissions prompts work (Calendar, Contacts, Location)

---

## Phase 4: Firebase Integration Validation

### Authentication
- [ ] Users can sign up and sign in
- [ ] Auth state persists across app restarts
- [ ] Logout clears auth state and AsyncStorage

### Firestore
- [ ] Events save to `users/{userId}/events` collection
- [ ] Event attendees saved with correct schema
- [ ] Events load from Firestore when app starts
- [ ] Updates to events sync to Firestore

### Storage
- [ ] User avatars (if any) upload to Firebase Storage
- [ ] No errors when uploading files

### Firestore Security Rules
- [ ] Users can only read/write their own events and data
- [ ] Attendees can access shared events (if rule supports)
- [ ] Public data (if any) accessible without auth

---

## Phase 5: Pre-Launch Checklist

### Code Quality
- [ ] No console.error/warn logs in production
- [ ] No red-screen errors when navigating between screens
- [ ] App doesn't crash on back button or navigation

### Performance
- [ ] App launches in < 5 seconds
- [ ] Screens render without lag (60 fps ideal)
- [ ] No memory leaks (check with Xcode/Android Studio profiler)

### Data & Privacy
- [ ] Firebase API key properly restricted (key restrictions in Console)
- [ ] No sensitive data hardcoded in code
- [ ] Privacy policy link in app (legal/privacy.tsx)
- [ ] Terms of service link in app (legal/terms.tsx)

### Metadata
- [ ] App icon looks good on home screen
- [ ] Splash screen displays correctly
- [ ] App name is correct
- [ ] Version number is 1.0.0

---

## Manual Test Cases

### Test Case 1: New User Journey
1. Fresh install of app
2. Sign up with email/password
3. Verify email (if required)
4. Grant calendar/contacts permissions
5. Create an event with a participant
6. Send invitation (if applicable)
7. Verify event appears in calendar
8. Check Firebase Firestore for saved event

### Test Case 2: Event Creation with Participants
1. Log in with existing account
2. Navigate to Create tab
3. Fill form: Title, Date, Time, Location, add 2+ participants
4. Save event
5. Verify event in calendar
6. Verify attendees saved in Firestore
7. (Future) Verify attendees receive notifications

### Test Case 3: Theme & Settings
1. Open Settings
2. Toggle dark mode on
3. Verify all screens respond (background, text colors)
4. Toggle dark mode off
5. Verify return to light mode
6. Check AsyncStorage saved preference

---

## Known Issues & Workarounds

### Web Platform
- [ ] Calendar, Contacts APIs use mock data (web limitations)
- [ ] Google Sign-In may need additional config
- [ ] Notifications not supported
- **Status:** Web marked as unsupported for MVP

### Test Suite
- [ ] Jest configuration needs Babel fixes (Flow types)
- [ ] Running `npm test` currently fails
- **Status:** Manual validation used instead for MVP validation

### Performance
- [ ] First app launch may be slow (Firebase init)
- **Improvement:** Implement splash screen wait logic

---

## Success Criteria for MVP Launch

- ✅ All tests in sections 2.1-2.6 pass on iOS and Android
- ✅ No console errors or red-screen crashes
- ✅ User can sign up, create events, and see them in calendar
- ✅ Firestore saves all event data correctly
- ✅ App launches and responds within acceptable time
- ✅ Privacy/Terms pages accessible
- ✅ TestFlight and Play Store builds created successfully

---

## Next Steps

1. **Build locally:**
   ```bash
   eas build --platform ios
   eas build --platform android
   ```

2. **Test on physical devices:**
   - Use TestFlight for iOS
   - Use Play Store internal testing for Android

3. **Document any issues:** Track bugs/UX issues in GitHub Issues

4. **Deploy to app stores:**
   - Prepare metadata (description, screenshots, icon)
   - Submit to Apple App Store (3-5 day review)
   - Submit to Google Play (instant approval)

---

**Last Updated:** 2026-06-23  
**MVP Target:** June 2026
