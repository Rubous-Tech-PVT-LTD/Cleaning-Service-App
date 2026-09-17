import { z } from 'zod';

export const profileSchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces')
    .trim()
    .refine((val) => val.trim().length > 0, 'Name cannot be empty or only spaces'),
  phone: z.string().optional()
});

export const otpSchema = z.object({
  otp: z.string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^[0-9]{6}$/, 'OTP must contain only numbers')
});

export const loginSchema = z.object({
  phone: z.string()
    .length(10, 'Phone number must be 10 digits')
    .regex(/^[0-9]{10}$/, 'Phone number must contain only numbers')
});

export const reviewSchema = z.object({
  rating: z.number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  comment: z.string()
    .max(500, 'Comment must be less than 500 characters')
    .optional()
});

export const searchSchema = z.object({
  query: z.string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must be less than 100 characters')
    .trim()
});

export const promoCodeSchema = z.object({
  code: z.string()
    .min(3, 'Promo code must be at least 3 characters')
    .max(20, 'Promo code must be less than 20 characters')
    .trim()
});

export const messageSchema = z.object({
  text: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must be less than 1000 characters')
    .trim()
});
