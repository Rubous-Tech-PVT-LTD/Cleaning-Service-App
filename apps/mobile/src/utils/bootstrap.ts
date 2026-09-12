



export const applyWorkarounds = () => {
  if (global.Event) {
    const OriginalEvent = global.Event;
    const EventWrapper = function (type: string, options: any) {
      return new (OriginalEvent as any)(type, options);
    };
    EventWrapper.prototype = OriginalEvent.prototype;


    Object.assign(EventWrapper, {
      NONE: 0,
      CAPTURING_PHASE: 1,
      AT_TARGET: 2,
      BUBBLING_PHASE: 3
    });

    global.Event = EventWrapper as any;
  }
};
