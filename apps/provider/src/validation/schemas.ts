import { z } from 'zod';

export const registrationSchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .trim(),
  email: z.string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .length(10, 'Phone number must be 10 digits')
    .regex(/^[0-9]{10}$/, 'Phone number must contain only numbers'),
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City must be less than 50 characters')
    .trim(),
  state: z.string()
    .min(2, 'State must be at least 2 characters')
    .max(50, 'State must be less than 50 characters')
    .trim(),
  addressLine1: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address must be less than 200 characters')
    .trim(),
  country: z.string()
    .min(2, 'Country must be at least 2 characters')
    .max(50, 'Country must be less than 50 characters')
    .trim(),
  professionId: z.string().optional(),
  professionIds: z.array(z.string()).optional(),
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

export const messageSchema = z.object({
  text: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must be less than 1000 characters')
    .trim()
});

export const completionOtpSchema = z.object({
  otp: z.string()
    .length(4, 'PIN must be 4 digits')
    .regex(/^[0-9]{4}$/, 'PIN must contain only numbers')
});
