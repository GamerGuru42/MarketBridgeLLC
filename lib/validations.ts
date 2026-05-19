import { z } from 'zod';

// ─── Auth Validation ─────────────────────────────────────────────────────────

export const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(1, "Password is required."),
});

export const signupSchema = z.object({
    email: z.string().email("Please enter a valid email address."),
    password: z.string()
        .min(8, "Password must be at least 8 characters long.")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, "Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number."),
    firstName: z.string().min(2, "First name must be at least 2 characters."),
    lastName: z.string().min(2, "Last name must be at least 2 characters."),
});

// ─── Seller Onboarding Validation ────────────────────────────────────────────

export const sellerApplicationSchema = z.object({
    userId: z.string().uuid("Invalid User ID."),
    fullName: z.string().min(3, "Full name must be at least 3 characters."),
    phoneNumber: z.string().min(10, "Please enter a valid phone number."),
    university: z.string().min(2, "University is required."),
    campusArea: z.string().min(2, "Campus area is required."),
    studentEmail: z.string()
        .email("Please enter a valid email address.")
        .refine((email) => email.toLowerCase().endsWith('.edu.ng'), {
            message: "A valid .edu.ng student email is required for verification.",
        }),
    sellCategories: z.array(z.string()).min(1, "Please select at least one category to sell."),
    idCardUrl: z.string().url("Valid ID Card URL is required.").optional().nullable(),
    bio: z.string().max(500, "Bio must be less than 500 characters.").optional().nullable(),
});

// ─── Contact Form Validation ─────────────────────────────────────────────────

export const contactSchema = z.object({
    name: z.string().min(2, "Name is required."),
    email: z.string().email("Please enter a valid email address."),
    subject: z.string().min(5, "Subject must be at least 5 characters."),
    message: z.string().min(10, "Message must be at least 10 characters."),
});
