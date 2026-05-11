// --- CRITICAL WORKAROUND for React Native 0.81 Event.NONE Bug ---
// React Native 0.81 defines Event.NONE as non-writable, which crashes whatwg-fetch and event-target-shim.
// We intercept global.Event and replace it with a proxy or custom class so assignments don't throw.

export const applyWorkarounds = () => {
  if (global.Event) {
    const OriginalEvent = global.Event;
    const EventWrapper = function (type: string, options: any) {
      return new (OriginalEvent as any)(type, options);
    };
    EventWrapper.prototype = OriginalEvent.prototype;

    // Define properties as writable so polyfills don't crash when assigning to them
    Object.assign(EventWrapper, {
      NONE: 0,
      CAPTURING_PHASE: 1,
      AT_TARGET: 2,
      BUBBLING_PHASE: 3
    });

    global.Event = EventWrapper as any;
  }
};
