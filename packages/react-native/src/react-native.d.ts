declare module 'react-native' {
  export const Platform: { OS: string; Version: string | number };
  export const AppState: {
    currentState: string;
    addEventListener(type: 'change', listener: (state: string) => void): { remove(): void };
  };
}
