export const MAX_DURATION_MINS = 180;

export const parseEstimatedTime = (timeString: string | null | undefined): number => {
  if (!timeString) return 30; // Default fallback if not available
  
  // Handle hour-based formats (e.g., "1 hr", "2 hrs", "1.5 hrs")
  const hourMatch = timeString.match(/(\d+\.?\d*)\s*hrs?/i);
  if (hourMatch) {
    return Math.round(parseFloat(hourMatch[1]) * 60); // Convert hours to minutes
  }
  
  // Handle minute-based formats (e.g., "30 mins", "60 min")
  const minsMatch = timeString.match(/(\d+)\s*mins?/i);
  if (minsMatch) return parseInt(minsMatch[1], 10);
  
  // Fallback to extracting any number
  const numericMatch = timeString.match(/(\d+)/);
  if (numericMatch) return parseInt(numericMatch[1], 10);
  
  return 30;
};

export const calculatePriceForDuration = (basePrice: number, baseDuration: number, currentDuration: number): number => {
  if (baseDuration <= 0) return basePrice;
  // Calculate price proportionally based on duration
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
