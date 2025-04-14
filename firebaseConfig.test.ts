import { FIREBASE_APP, FIREBASE_AUTH, FIREBASE_STORAGE, FIREBASE_FIRESTORE } from "./firebaseConfig";
import { describe, it, expect } from "@jest/globals";

// Mock Firebase modules
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => "MockFirebaseApp"),
}));

jest.mock("firebase/auth", () => ({
  initializeAuth: jest.fn(() => "MockFirebaseAuth"),
}));

jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(() => "MockFirebaseStorage"),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => "MockFirebaseFirestore"),
}));

describe("Firebase Config", () => {
  it("should initialize Firebase App", () => {
    expect(FIREBASE_APP).toBe("MockFirebaseApp");
  });

  it("should initialize Firebase Auth", () => {
    expect(FIREBASE_AUTH).toBe("MockFirebaseAuth");
  });

  it("should initialize Firebase Storage", () => {
    expect(FIREBASE_STORAGE).toBe("MockFirebaseStorage");
  });

  it("should initialize Firebase Firestore", () => {
    expect(FIREBASE_FIRESTORE).toBe("MockFirebaseFirestore");
  });
});