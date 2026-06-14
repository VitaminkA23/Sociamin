import { useState, type ChangeEvent, type FormEvent } from "react";
import { Mail, MapPin, Clock, CheckCircle, Loader } from "lucide-react";
import styles from "./ContactPage.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  form?: string;
}

type SubmitState = "idle" | "submitting" | "success";

const EMPTY: FormValues = { name: "", email: "", subject: "", message: "" };

// ── Validation ────────────────────────────────────────────────────────────────

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim())  errors.name    = "Name is required";
  if (!values.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Please enter a valid email address";
  }
  if (!values.subject.trim()) errors.subject = "Subject is required";
  if (!values.message.trim()) {
    errors.message = "Message is required";
  } else if (values.message.trim().length < 10) {
    errors.message = "Message must be at least 10 characters";
  }
  return errors;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ContactPage() {
  const [values,      setValues]      = useState<FormValues>(EMPTY);
  const [errors,      setErrors]      = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [touched,     setTouched]     = useState<Partial<Record<keyof FormValues, boolean>>>({});

  function handleChange(field: keyof FormValues) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const next = { ...values, [field]: e.target.value };
      setValues(next);
      if (touched[field]) {
        setErrors((prev) => ({ ...prev, [field]: validate(next)[field] }));
      }
    };
  }

  function handleBlur(field: keyof FormValues) {
    return () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      setErrors((prev) => ({ ...prev, [field]: validate(values)[field] }));
    };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const allTouched = { name: true, email: true, subject: true, message: true };
    setTouched(allTouched);
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitState("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:    values.name.trim(),
          email:   values.email.trim(),
          subject: values.subject.trim(),
          message: values.message.trim(),
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        setErrors({ form: data.message ?? "Something went wrong. Please try again." });
        setSubmitState("idle");
        return;
      }

      setSubmitState("success");
    } catch {
      setErrors({ form: "Network error. Please check your connection and try again." });
      setSubmitState("idle");
    }
  }

  const isSubmitting = submitState === "submitting";

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <header className={styles.header}>
        <span className={styles.headerTag}>Get in touch</span>
        <h1 className={styles.headerTitle}>Contact Us</h1>
        <p className={styles.headerSubtitle}>
          We'd love to hear from you — whether it's a question, a thought, or just a hello.
        </p>
      </header>

      {/* ── Two-column layout ── */}
      <div className={styles.body}>

        {/* ── LEFT: Contact info ── */}
        <div className={styles.infoCol}>
          <div className={styles.infoCard}>
            <h2 className={styles.infoTitle}>Reach us directly</h2>

            <div className={styles.infoItem}>
              <div className={styles.infoIconWrap}>
                <Mail size={18} strokeWidth={1.8} />
              </div>
              <div>
                <p className={styles.infoLabel}>Email</p>
                <p className={styles.infoValue}>hello@vitamina.app</p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoIconWrap}>
                <MapPin size={18} strokeWidth={1.8} />
              </div>
              <div>
                <p className={styles.infoLabel}>Location</p>
                <p className={styles.infoValue}>Remote-first, Worldwide</p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoIconWrap}>
                <Clock size={18} strokeWidth={1.8} />
              </div>
              <div>
                <p className={styles.infoLabel}>Active Hours</p>
                <p className={styles.infoValue}>Mon – Fri, 9am – 5pm UTC</p>
              </div>
            </div>

            <div className={styles.infoAccent}>
              <p className={styles.infoAccentText}>
                Typically respond within <strong>24 hours</strong> on weekdays.
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Form card ── */}
        <div className={styles.formCol}>
          {submitState === "success" ? (
            <SuccessCard onReset={() => { setValues(EMPTY); setErrors({}); setTouched({}); setSubmitState("idle"); }} />
          ) : (
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>Send a Message</h2>
              <p className={styles.formSubtitle}>Fill in the details below and we'll get back to you.</p>

              <form className={styles.form} onSubmit={handleSubmit} noValidate>

                {errors.form && (
                  <div className={styles.formError} role="alert">{errors.form}</div>
                )}

                {/* Name */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="name">Name</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
                    value={values.name}
                    onChange={handleChange("name")}
                    onBlur={handleBlur("name")}
                    disabled={isSubmitting}
                    autoComplete="name"
                  />
                  {errors.name && (
                    <span className={styles.fieldError} role="alert">{errors.name}</span>
                  )}
                </div>

                {/* Email */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                    value={values.email}
                    onChange={handleChange("email")}
                    onBlur={handleBlur("email")}
                    disabled={isSubmitting}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <span className={styles.fieldError} role="alert">{errors.email}</span>
                  )}
                </div>

                {/* Subject */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="subject">Subject</label>
                  <input
                    id="subject"
                    type="text"
                    placeholder="What's on your mind?"
                    className={`${styles.input} ${errors.subject ? styles.inputError : ""}`}
                    value={values.subject}
                    onChange={handleChange("subject")}
                    onBlur={handleBlur("subject")}
                    disabled={isSubmitting}
                  />
                  {errors.subject && (
                    <span className={styles.fieldError} role="alert">{errors.subject}</span>
                  )}
                </div>

                {/* Message */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    placeholder="Tell us more…"
                    rows={5}
                    className={`${styles.input} ${styles.textarea} ${errors.message ? styles.inputError : ""}`}
                    value={values.message}
                    onChange={handleChange("message")}
                    onBlur={handleBlur("message")}
                    disabled={isSubmitting}
                  />
                  {errors.message && (
                    <span className={styles.fieldError} role="alert">{errors.message}</span>
                  )}
                </div>

                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className={styles.btnLoading}>
                      <Loader size={15} strokeWidth={2} className={styles.spinner} />
                      Sending…
                    </span>
                  ) : (
                    "Submit"
                  )}
                </button>

              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Success Card ──────────────────────────────────────────────────────────────

function SuccessCard({ onReset }: { onReset: () => void }) {
  return (
    <div className={styles.successCard}>
      <div className={styles.successIcon}>
        <CheckCircle size={36} strokeWidth={1.5} />
      </div>
      <h2 className={styles.successTitle}>Message sent!</h2>
      <p className={styles.successText}>
        Thanks for reaching out. We've received your message and will get back to you
        within 24 hours.
      </p>
      <button className={styles.successBtn} onClick={onReset}>
        Send another message
      </button>
    </div>
  );
}