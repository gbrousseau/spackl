import { User } from 'firebase/auth';

declare global {
  interface AuthUser extends User {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    phoneNumber: string | null;
    providerId: string;
  }
}

export {};