import { useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import type { AuthResponse } from "../types/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RegisterValues {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterErrors {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;

const EMPTY: RegisterValues = {
  fullName: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useRegisterForm() {
  const { login } = useAuth();
  const [values, setValues] = useState<RegisterValues>(EMPTY);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // ── Validation ─────────────────────────────────────────────────────────────

  function validate(): boolean {
    const next: RegisterErrors = {};

    if (!values.fullName.trim()) {
      next.fullName = "Full name is required";
    } else if (values.fullName.trim().length < 2) {
      next.fullName = "Name must be at least 2 characters";
    }

    const email = values.email.trim();
    const phone = values.phoneNumber.trim();

    if (!email && !phone) {
      next.email = "An email address or phone number is required";
    } else if (email && !EMAIL_RE.test(email)) {
      next.email = "Enter a valid email address";
    } else if (phone && !PHONE_RE.test(phone)) {
      next.phoneNumber = "Enter a valid phone number";
    }

    if (!values.password) {
      next.password = "Password is required";
    } else if (values.password.length < 8) {
      next.password = "Password must be at least 8 characters";
    }

    if (!values.confirmPassword) {
      next.confirmPassword = "Please confirm your password";
    } else if (values.password !== values.confirmPassword) {
      next.confirmPassword = "Passwords do not match";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleChange(field: keyof RegisterValues) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setValues((prev) => ({ ...prev, [field]: value }));

      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }

      if (field === "password" && errors.confirmPassword === "Passwords do not match") {
        setErrors(({ confirmPassword: _removed, ...rest }) => rest);
      }
    };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const body: Record<string, string> = { password: values.password };
      if (values.email.trim()) body["email"] = values.email.trim();
      if (values.phoneNumber.trim()) body["phoneNumber"] = values.phoneNumber.trim();

      const data = await api.post<AuthResponse>("/auth/register", body);
      login(data.token, data.user);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Network error. Please check your connection.";
      setErrors({ form: message });
    } finally {
      setIsLoading(false);
    }
  }

  return { values, errors, isLoading, handleChange, handleSubmit };
}
