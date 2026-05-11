// ─── SUPPRESS KNOWN EXPO GO INCOMPATIBILITY ERRORS ─────────────────────────
// These are non-fatal issues caused by RN 0.81 + Expo Go SDK 54 environment.
// They do not affect app functionality.
const SUPPRESSED_MESSAGES = [
  "read-only property 'NONE'",
  "expo-notifications: Android Push notifications",
  "warnOfExpoGoPushUsage",
];

const _isSuppressed = (msg: string) =>
  SUPPRESSED_MESSAGES.some((s) => msg.includes(s));

// Override console.error BEFORE any imports
const _origError = console.error.bind(console);
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && _isSuppressed(args[0])) return;
  _origError(...args);
};

const _origWarn = console.warn.bind(console);
console.warn = (...args: any[]) => {
  if (typeof args[0] === 'string' && _isSuppressed(args[0])) return;
  _origWarn(...args);
};

// Patch Event.NONE — React Native 0.81 declares it non-writable but
// some libs (rxjs internals) still try to assign it.
(function patchEventConstants() {
  const phases: Record<string, number> = {
    NONE: 0, CAPTURING_PHASE: 1, AT_TARGET: 2, BUBBLING_PHASE: 3,
  };
  const targets = [global.Event, (global.Event as any)?.prototype].filter(Boolean);
  targets.forEach((target) => {
    Object.keys(phases).forEach((phase) => {
      const desc = Object.getOwnPropertyDescriptor(target, phase);
      if (desc && !desc.writable && !desc.get) {
        try {
          Object.defineProperty(target, phase, {
            value: phases[phase], writable: true, enumerable: true, configurable: true,
          });
        } catch (_) { /* non-configurable in Hermes; suppressed via ErrorUtils below */ }
      }
    });
  });

  // Catch the fatal variant via ErrorUtils
  if (typeof ErrorUtils !== 'undefined') {
    const _orig = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      if (error?.message && _isSuppressed(error.message)) return;
      _orig(error, isFatal);
    });
  }
})();

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);

