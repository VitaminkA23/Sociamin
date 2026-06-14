import { Link } from "react-router-dom";
import { Logo } from "../Logo/Logo";
import { Github, Instagram, Twitter } from "lucide-react";
import styles from "./Footer.module.css";

const QUICK_LINKS = [
  { to: "/feed",    label: "Feed"       },
  { to: "/about",   label: "About Us"   },
  { to: "/contact", label: "Contact Us" },
] as const;

const LEGAL_LINKS = [
  { label: "Privacy Policy"   },
  { label: "Terms of Service" },
  { label: "Cookie Policy"    },
] as const;

const SOCIALS = [
  { Icon: Twitter,   label: "Twitter"   },
  { Icon: Instagram, label: "Instagram" },
  { Icon: Github,    label: "GitHub"    },
] as const;

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>

        {/* ── Col 1: Brand ── */}
        <div className={styles.col}>
          <div className={styles.brand}>
            <Logo size={50} />
            <span className={styles.brandName} aria-hidden="true">
             VitaminA
            </span>
          </div>
          <p className={styles.slogan}>Your healthy dose of connection.</p>
          <p className={styles.copy}>© {new Date().getFullYear()} VitaminA. All rights reserved.</p>
        </div>

        {/* ── Col 2: Quick Links ── */}
        <div className={styles.col}>
          <p className={styles.colHeading}>Quick Links</p>
          <ul className={styles.linkList}>
            {QUICK_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className={styles.footerLink}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Col 3: Legal ── */}
        <div className={styles.col}>
          <p className={styles.colHeading}>Legal</p>
          <ul className={styles.linkList}>
            {LEGAL_LINKS.map(({ label }) => (
              <li key={label}>
                {/* Dummy anchors — real routes added when pages exist */}
                <a href="#" className={styles.footerLink} onClick={(e) => e.preventDefault()}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* ── Bottom bar ── */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomInner}>
          <span className={styles.bottomText}>Made with care for your wellbeing ✦</span>
          <div className={styles.socials}>
            {SOCIALS.map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                className={styles.socialLink}
                aria-label={label}
                onClick={(e) => e.preventDefault()}
              >
                <Icon size={16} strokeWidth={1.8} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
