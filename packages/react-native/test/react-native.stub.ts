type Listener = (state: string) => void;

const listeners = new Set<Listener>();

export const Platform = { OS: 'android', Version: 34 };

export const AppState = {
  currentState: 'active',
  addEventListener(_type: 'change', listener: Listener) {
    listeners.add(listener);
    return { remove: () => listeners.delete(listener) };
  },
};

export function emitAppState(state: string): void {
  AppState.currentState = state;
  listeners.forEach((listener) => listener(state));
}
