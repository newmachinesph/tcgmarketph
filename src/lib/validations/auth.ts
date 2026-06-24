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

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
