import { Link } from "react-router-dom";
import { Logo } from "../../components/Logo/Logo";
import { useLoginForm } from "../../hooks/useLoginForm";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const { values, errors, isLoading, handleChange, handleSubmit } = useLoginForm();

  return (
    <div className={styles.page}>
      <div className={styles.layout}>

        {/* ── LEFT: Brand panel ── */}
        <aside className={styles.brand}>
          <div>
            <Logo size={110} />
          </div>

          <h1 className={styles.brandName}>
            VitaminA
          </h1>

          <p className={styles.slogan}>Your healthy dose of connection</p>

          <div className={styles.decorDots}>
            <span className={styles.decorDot} />
            <span className={styles.decorDot} />
            <span className={styles.decorDot} />
          </div>
        </aside>

        {/* ── RIGHT: Login card ── */}
        <main className={styles.cardWrap}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Login</h2>
            <p className={styles.cardSubtitle}>Welcome back. Sign in to your account.</p>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>

              {errors.form && (
                <div className={styles.formError} role="alert">
                  {errors.form}
                </div>
              )}

              {/* Email / Phone */}
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="identifier">
                  Email or Phone
                </label>
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="Email or phone number"
                  className={`${styles.input} ${errors.identifier ? styles.inputError : ""}`}
                  value={values.identifier}
                  onChange={handleChange("identifier")}
                  disabled={isLoading}
                  aria-describedby={errors.identifier ? "identifier-error" : undefined}
                />
                {errors.identifier && (
                  <span id="identifier-error" className={styles.fieldError} role="alert">
                    {errors.identifier}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
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

              {/* Actions */}
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
                      Signing in…
                    </span>
                  ) : (
                    "Login"
                  )}
                </button>

                <button
                  type="button"
                  className={styles.forgotLink}
                  onClick={() => {
                    /* TODO: navigate to /forgot-password */
                  }}
                >
                  Forgot password?
                </button>

                <div className={styles.divider}>or</div>

                <Link to="/register" className={styles.btnSecondary}>
                  Create Account
                </Link>
              </div>

            </form>
          </div>
        </main>

      </div>
    </div>
  );
}