import { Link } from "react-router-dom";
import { Logo } from "../../components/Logo/Logo";
import { useRegisterForm } from "../../hooks/useRegisterForm";
import styles from "./RegisterPage.module.css";

export function RegisterPage() {
  const { values, errors, isLoading, handleChange, handleSubmit } = useRegisterForm();

  return (
    <div className={styles.page}>
      <div className={styles.layout}>

        {/* ══════════════════════════════════════════
            LEFT — Brand panel (identical to Login)
        ══════════════════════════════════════════ */}
        <aside className={styles.brand}>
          <div className={styles.logoWrap}>
            <Logo size={52} />
          </div>

          <h1 className={styles.brandName}>
            {/*
              The 'V' is rendered as an italicised character flipped vertically
              via CSS, visually evoking the ∀ (for-all) symbol while staying in
              DM Serif Display for brand coherence.
            */}
            <span className={styles.brandNameSymbol} aria-hidden="true">V</span>
            <span className={styles.srOnly}>V</span>
            itaminA
          </h1>

          <p className={styles.slogan}>Your healthy dose of connection</p>

          <div className={styles.decorDots}>
            <span className={styles.decorDot} />
            <span className={styles.decorDot} />
            <span className={styles.decorDot} />
          </div>
        </aside>

        {/* ══════════════════════════════════════════
            RIGHT — Registration card
        ══════════════════════════════════════════ */}
        <main className={styles.cardWrap}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Create Account</h2>
            <p className={styles.cardSubtitle}>
              Join the VitaminA community — it only takes a minute.
            </p>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>

              {/* Form-level error banner */}
              {errors.form && (
                <div className={styles.formError} role="alert">
                  {errors.form}
                </div>
              )}

              {/* ── Personal info ── */}
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  className={`${styles.input} ${errors.fullName ? styles.inputError : ""}`}
                  value={values.fullName}
                  onChange={handleChange("fullName")}
                  disabled={isLoading}
                  aria-describedby={errors.fullName ? "fullName-error" : undefined}
                />
                {errors.fullName && (
                  <span id="fullName-error" className={styles.fieldError} role="alert">
                    {errors.fullName}
                  </span>
                )}
              </div>

              {/* ── Contact — email OR phone (at least one required) ── */}
              <div className={styles.sectionDivider}>
                <span>Sign in with — choose one or both</span>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                  value={values.email}
                  onChange={handleChange("email")}
                  disabled={isLoading}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <span id="email-error" className={styles.fieldError} role="alert">
                    {errors.email}
                  </span>
                )}
              </div>

              <div className={styles.orDivider} aria-hidden="true">or</div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="phoneNumber">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+1 555 000 0000"
                  className={`${styles.input} ${errors.phoneNumber ? styles.inputError : ""}`}
                  value={values.phoneNumber}
                  onChange={handleChange("phoneNumber")}
                  disabled={isLoading}
                  aria-describedby={errors.phoneNumber ? "phoneNumber-error" : undefined}
                />
                {errors.phoneNumber && (
                  <span id="phoneNumber-error" className={styles.fieldError} role="alert">
                    {errors.phoneNumber}
                  </span>
                )}
              </div>

              {/* ── Divider ── */}
              <div className={styles.sectionDivider}>
                <span>Password</span>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                  value={values.password}
                  onChange={handleChange("password")}
                  disabled={isLoading}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                {errors.password && (
                  <span id="password-error" className={styles.fieldError} role="alert">
                    {errors.password}
                  </span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                  value={values.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  disabled={isLoading}
                  aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                />
                {errors.confirmPassword && (
                  <span id="confirmPassword-error" className={styles.fieldError} role="alert">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>

              {/* ── Actions ── */}
              <div className={styles.actions}>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <span className={styles.btnLoading}>
                      <span className={styles.spinner} aria-hidden="true" />
                      Creating account…
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </button>

                <p className={styles.loginPrompt}>
                  Already have an account?{" "}
                  <Link to="/login" className={styles.loginLink}>
                    Login
                  </Link>
                </p>
              </div>

            </form>
          </div>
        </main>

      </div>
    </div>
  );
}
