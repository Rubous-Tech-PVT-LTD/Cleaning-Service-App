export const MAX_DURATION_MINS = 180;

export const parseEstimatedTime = (timeString: string | null | undefined): number => {
  if (!timeString) return 30;

  const hourMatch = timeString.match(/(\d+\.?\d*)\s*hrs?/i);
  if (hourMatch) {
    return Math.round(parseFloat(hourMatch[1]) * 60);
  }

  const minsMatch = timeString.match(/(\d+)\s*mins?/i);
  if (minsMatch) return parseInt(minsMatch[1], 10);

  const numericMatch = timeString.match(/(\d+)/);
  if (numericMatch) return parseInt(numericMatch[1], 10);

  return 30;
};

export const calculatePriceForDuration = (basePrice: number, baseDuration: number, currentDuration: number): number => {
  if (baseDuration <= 0) return basePrice;

  return Math.round((basePrice / baseDuration) * currentDuration);
};

export const getNextDuration = (currentDuration: number, baseDuration: number): number => {
  return Math.round(currentDuration + baseDuration);
};

export const getPrevDuration = (currentDuration: number, baseDuration: number): number => {
  const prev = Math.round(currentDuration - baseDuration);
  return prev < baseDuration ? baseDuration : prev;
};

export const isDurationAtMaximum = (currentDuration: number): boolean => {
  return currentDuration >= MAX_DURATION_MINS;
};

export const getMaxDurationMessage = (): string => {
  return `Maximum duration reached. You can book this service for up to ${MAX_DURATION_MINS} minutes.`;
};
