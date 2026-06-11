import { z } from "zod";

export const passwordRequirements = {
  minLength: {
    id: "minLength",
    label: "At least 8 characters",
    test: (val: string) => val.length >= 8,
  },
  hasUppercase: {
    id: "hasUppercase",
    label: "At least one uppercase letter (A-Z)",
    test: (val: string) => /[A-Z]/.test(val),
  },
  hasLowercase: {
    id: "hasLowercase",
    label: "At least one lowercase letter (a-z)",
    test: (val: string) => /[a-z]/.test(val),
  },
  hasDigit: {
    id: "hasDigit",
    label: "At least one digit (0-9)",
    test: (val: string) => /[0-9]/.test(val),
  },
  hasSpecial: {
    id: "hasSpecial",
    label: "At least one special character",
    test: (val: string) => /[^A-Za-z0-9]/.test(val),
  },
};

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .refine((val) => /[A-Z]/.test(val), "Password must contain at least one uppercase letter")
  .refine((val) => /[a-z]/.test(val), "Password must contain at least one lowercase letter")
  .refine((val) => /[0-9]/.test(val), "Password must contain at least one number")
  .refine((val) => /[^A-Za-z0-9]/.test(val), "Password must contain at least one special character");

export const registrationSchema = z.object({
  displayName: z.string().min(2, "Name/entity must be at least 2 characters long"),
  email: z.string().email("Invalid communication email address"),
  physicalAddress: z.string().min(5, "Physical address must be at least 5 characters long"),
  password: passwordSchema,
});

export interface PasswordStrengthResult {
  score: number; // 0 to 5
  status: "None" | "Very Weak" | "Weak" | "Moderate" | "Strong" | "Very Strong";
  colorClass: string;
  progressBarColorClass: string;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasDigit: boolean;
    hasSpecial: boolean;
  };
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      status: "None",
      colorClass: "text-gray-400",
      progressBarColorClass: "bg-gray-200",
      checks: {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasDigit: false,
        hasSpecial: false,
      },
    };
  }

  const checks = {
    minLength: passwordRequirements.minLength.test(password),
    hasUppercase: passwordRequirements.hasUppercase.test(password),
    hasLowercase: passwordRequirements.hasLowercase.test(password),
    hasDigit: passwordRequirements.hasDigit.test(password),
    hasSpecial: passwordRequirements.hasSpecial.test(password),
  };

  const trueCount = Object.values(checks).filter(Boolean).length;

  let status: "None" | "Very Weak" | "Weak" | "Moderate" | "Strong" | "Very Strong" = "Very Weak";
  let colorClass = "text-red-500 font-bold";
  let progressBarColorClass = "bg-red-500";

  switch (trueCount) {
    case 1:
      status = "Very Weak";
      colorClass = "text-red-500 font-bold";
      progressBarColorClass = "bg-red-500";
      break;
    case 2:
      status = "Weak";
      colorClass = "text-orange-500 font-bold";
      progressBarColorClass = "bg-orange-500";
      break;
    case 3:
      status = "Moderate";
      colorClass = "text-amber-500 font-bold";
      progressBarColorClass = "bg-amber-500";
      break;
    case 4:
      status = "Strong";
      colorClass = "text-teal-600 font-bold";
      progressBarColorClass = "bg-teal-500";
      break;
    case 5:
      status = "Very Strong";
      colorClass = "text-green-600 font-bold";
      progressBarColorClass = "bg-green-500";
      break;
    default:
      status = "Very Weak";
      colorClass = "text-gray-400 font-bold";
      progressBarColorClass = "bg-gray-200";
  }

  return {
    score: trueCount,
    status,
    colorClass,
    progressBarColorClass,
    checks,
  };
}
