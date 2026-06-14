import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import type { AuthResponse } from "../types/api";

interface LoginFormState {
  identifier: string;
  password: string;
}

interface LoginFormErrors {
  identifier?: string;
  password?: string;
  form?: string;
}

export function useLoginForm() {
  const { login } = useAuth();
  const [values, setValues] = useState<LoginFormState>({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  function validate(): boolean {
    const next: LoginFormErrors = {};

    if (!values.identifier.trim()) {
      next.identifier = "Email or phone number is required";
    }

    if (!values.password) {
      next.password = "Password is required";
    } else if (values.password.length < 8) {
      next.password = "Password must be at least 8 characters";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleChange(field: keyof LoginFormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const isEmail = values.identifier.includes("@");
      const body: Record<string, string> = { password: values.password };
      if (isEmail) body["email"] = values.identifier;
      else body["phoneNumber"] = values.identifier;

      const data = await api.post<AuthResponse>("/auth/login", body);
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
