declare module '@/contexts/AuthContext' {
  export const useAuth: () => {
    user: {
      phoneNumber?: string;
      email?: string;
    };
  };
}

declare module '@/contexts/ThemeContext' {
  export const useTheme: () => {
    isDarkMode: boolean;
  };
} 