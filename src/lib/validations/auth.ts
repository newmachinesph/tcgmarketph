import { z } from "zod";

const emailField = z
  .string()
  .check(z.email({ message: "Enter a valid email address" }));

const passwordField = z
  .string()
  .min(8, "At least 8 characters")
  .check(z.regex(/[a-zA-Z]/, { message: "Must contain at least one letter" }))
  .check(z.regex(/[0-9]/, { message: "Must contain at least one number" }));

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, "At least 2 characters").max(64, "Too long"),
    email: emailField,
    password: passwordField,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export const profileSetupSchema = z.object({
  city: z.string().min(1, "Please select your city"),
  bio: z.string().max(160, "Max 160 characters"),
  phone: z.union([
    z.literal(""),
    z.string().check(
      z.regex(/^(09|\+639)\d{9}$/, { message: "Enter a valid Philippine mobile number (09XXXXXXXXX)" })
    ),
  ]),
  games: z.string(), // comma-separated game keys
});

export const settingsProfileSchema = z.object({
  name: z.string().min(2, "At least 2 characters").max(64, "Too long"),
  city: z.string().min(1, "Please select your city"),
  bio: z.string().max(160, "Max 160 characters"),
  phone: z.union([
    z.literal(""),
    z.string().check(
      z.regex(/^(09|\+639)\d{9}$/, { message: "Enter a valid Philippine mobile number (09XXXXXXXXX)" })
    ),
  ]),
  games: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;
export type SettingsProfileInput = z.infer<typeof settingsProfileSchema>;
