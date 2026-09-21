export const applyWorkarounds = () => {
  try {
    const g = globalThis as any;
    if (g && g.Event) {
      if (typeof g.Event.NONE === 'undefined') {
        try {
          Object.defineProperties(g.Event, {
            NONE: { value: 0, writable: true, configurable: true },
            CAPTURING_PHASE: { value: 1, writable: true, configurable: true },
            AT_TARGET: { value: 2, writable: true, configurable: true },
            BUBBLING_PHASE: { value: 3, writable: true, configurable: true },
          });
        } catch (_) {
          // If Event is sealed/read-only in newer Hermes, no workaround needed
        }
      }
    }
  } catch (_) {
    // Silently ignore
  }
};
