# Spackl MVP - Next Actions (Concrete Steps)

## Current Status
- ✅ Firebase config secured (environment variables)
- ✅ Event creation form fully implemented  
- ✅ 5 main screens exist (Calendar, Invitations, Create, Contacts, Settings)
- ⚠️ Jest test infrastructure has configuration issues (Babel/Flow types)
- 📋 Manual validation guide created (MVP_VALIDATION.md)

---

## Immediate Next Steps (This Week)

### 1. Build and Test Locally (Today)
```bash
# Install dependencies (should already be done)
npm install --legacy-peer-deps

# Test on iOS simulator
eas build --platform ios --profile preview
# Or locally:
npm run ios

# Test on Android emulator  
eas build --platform android --profile preview
# Or locally:
npm run android
```

**Goal:** Verify app runs without crashes on simulator/emulator

---

### 2. Manual Validation Checklist (2-3 hours)

Use `MVP_VALIDATION.md` document to test:

**Required Tests (can't ship MVP without these):**
- [ ] Authentication: Sign up, sign in, logout work
- [ ] Create Event: Form renders, can fill out, saves to Firestore
- [ ] Calendar: Shows created events
- [ ] No red-screen errors on any screen
- [ ] Permissions prompts work (Calendar, Contacts, Location)

**Nice-to-Have Tests (can defer post-MVP):**
- [ ] Invitations receive/accept flow  
- [ ] Contacts search
- [ ] Theme persistence

---

### 3. Firebase Firestore Security Review (1-2 hours)

**Verify in Firebase Console:**
1. Go to `Storage` → Rules
2. Ensure rules restrict access to user's own data:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth.uid == userId;
       }
     }
   }
   ```

3. Go to `Storage` → Rules  
4. Ensure file uploads are user-restricted

**If NOT configured:** Firebase will be wide-open to any user reading/writing data - SECURITY RISK

---

### 4. EAS Build Configuration (1-2 hours)

**iOS:**
1. Connect Apple Developer account:
   ```bash
   eas credentials
   # Select iOS, generate/provide provisioning profile
   ```

2. Verify bundle ID matches Firebase config: `com.spackl.app`

3. Build for TestFlight:
   ```bash
   eas build --platform ios --auto-submit
   ```

**Android:**
1. Create/upload signing keystore:
   ```bash
   eas credentials
   # Select Android, create keystore
   ```

2. Verify package name matches Firebase config: `com.spackl.app`

3. Build for Play Store Internal Testing:
   ```bash
   eas build --platform android
   ```

---

### 5. TestFlight / Play Store Setup (1 hour)

**iOS - TestFlight:**
1. Open App Store Connect
2. Create new app (app name: "Spackl")  
3. Wait for build to appear in TestFlight
4. Add yourself + team members as testers
5. Test on real iPhone

**Android - Play Store:**
1. Create app in Play Console
2. Fill in app details (title, description, icon, category)
3. Upload APK/AAB build
4. Create internal test track
5. Add testers (Gmail addresses)

---

## Firebase Secrets Verification

**Before submitting builds, verify .env has:**
```bash
# In .env file - should NOT be in source code
EXPO_PUBLIC_FIREBASE_API_KEY=<key>
EXPO_PUBLIC_FIREBASE_PROJECT_ID=spacklapp
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=spacklapp.firebaseapp.com
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=spacklapp.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<id>
EXPO_PUBLIC_FIREBASE_APP_ID=<app-id>

EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<id>
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<id>
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<key>

EXPO_PUBLIC_EAS_PROJECT_ID=b8838a7f-18f1-465c-a19b-e0ca63a2eafd
```

**Do NOT commit .env file** (already in .gitignore ✓)

---

## Known Issues & Workarounds

### Issue: Tests don't run (Jest/Babel error)
- **Status:** Low priority for MVP - manual validation sufficient
- **Workaround:** Use manual testing checklist in MVP_VALIDATION.md
- **Fix (post-MVP):** Update Babel config to handle Flow types or remove Flow

### Issue: Web platform has mock data
- **Status:** Known limitation
- **Solution:** Mark web as unsupported, iOS/Android only for MVP
- **File:** app/json already set to iOS/Android only ✓

### Issue: Notifications aren't sent (sendEventNotification is stub)
- **Status:** Can defer - not critical for MVP
- **Improvement:** Implement Firebase Cloud Messaging post-MVP

---

## Release Checklist

**Before hitting "Submit" on app stores:**

- [ ] All manual validation tests pass (MVP_VALIDATION.md)
- [ ] No console.log/console.warn in production code
- [ ] Firebase rules restrict data access properly
- [ ] .env file configured with real secrets
- [ ] App icon is 1024x1024 PNG (in assets/images/)
- [ ] Privacy Policy linked (legal/privacy.tsx) ✓
- [ ] Terms of Service linked (legal/terms.tsx) ✓
- [ ] Version bumped to 1.0.0 (in app.json) ✓
- [ ] App name is "Spackl" (in app.json) ✓

---

## Timeline Estimate

| Phase | Task | Effort | When |
|-------|------|--------|------|
| 1 | Build locally & test simulator | 1-2 hrs | Today |
| 2 | Manual validation (MVP_VALIDATION.md) | 3-4 hrs | Today/Tomorrow |
| 3 | Firebase security rules review | 1-2 hrs | Tomorrow |
| 4 | EAS build config (iOS + Android) | 2-3 hrs | Tomorrow |
| 5 | TestFlight/Play Store setup | 1-2 hrs | Day 3 |
| 6 | Device testing on real phones | 2-3 hrs | Day 3 |
| 7 | Final polish & app store submission | 1-2 hrs | Day 3-4 |

**Total: ~15-20 hours of work for MVP release**

---

## Critical Success Criteria

✅ App must launch without crashes  
✅ User can sign up and log in  
✅ User can create an event  
✅ Event appears in calendar  
✅ Firebase saves data correctly  
✅ App works on iOS and Android  

If all of the above pass → Ready to submit to app stores

---

## Post-MVP Improvements (Not Blocking Launch)

- [ ] Fix Jest test infrastructure
- [ ] Implement Firebase Cloud Messaging for notifications
- [ ] Add app store screenshots and review guidelines
- [ ] Performance optimization (lazy loading, virtualized lists)
- [ ] Crash reporting (Sentry or Firebase Crashlytics)
- [ ] Analytics (Firebase Analytics or Mixpanel)
- [ ] Push notifications end-to-end
- [ ] Contact sharing feature fully integrated
- [ ] Web platform support

---

## Questions to Answer Before Launching

1. **Do you want notifications sent to attendees when invited?**
   - Currently: Not implemented (sendEventNotification is stub)
   - If YES: Need Firebase Cloud Messaging setup (2-3 days work)
   - If NO: Can launch without

2. **Should groups feature be visible in MVP?**
   - Currently: GroupContext exists but UI not exposed
   - If YES: Need to add UI in Settings/Contacts
   - If NO: Keep hidden, launch with 5 main tabs only

3. **Is contact sharing MVP-required?**
   - Currently: Settings has option but backend not fully integrated
   - If YES: Need to complete backend + tests
   - If NO: Can mark as "coming soon"

4. **Do you need to support multiple calendars (shared calendars)?**
   - Currently: SharedCalendars component exists but needs full integration
   - If YES: Needs more work and testing
   - If NO: Simplify to show only user's calendar

**Recommend answering these before day 2 to scope remaining work**

---

**Next Action:** Start with "Build and Test Locally" step above.  
**Questions?** See MVP_VALIDATION.md for detailed test procedures.
