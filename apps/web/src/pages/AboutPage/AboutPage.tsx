import { Leaf, MessageCircle, Heart, Shield, Sparkles, Users, Zap, Globe } from "lucide-react";
import { Logo } from "../../components/Logo/Logo";
import styles from "./AboutPage.module.css";

// ── Data ──────────────────────────────────────────────────────────────────────

const WHY_ITEMS = [
  {
    Icon: Leaf,
    title: "Mindful by Design",
    desc: "Every interaction is crafted to slow down the scroll and make space for what matters — genuine human connection.",
  },
  {
    Icon: MessageCircle,
    title: "Real Conversations",
    desc: "No algorithmic rage-bait. VitaminA surfaces posts from people you care about, in the order they were shared.",
  },
  {
    Icon: Shield,
    title: "Privacy First",
    desc: "Your data is yours. We don't sell it, we don't weaponise it. Full stop.",
  },
];

const VALUES = [
  { Icon: Heart,    title: "Wellness First",        desc: "Your mental health shapes every product decision we make."              },
  { Icon: Sparkles, title: "Authentic Expression",  desc: "Be yourself — imperfect, unfiltered, and wonderfully human."            },
  { Icon: Users,    title: "Community Care",         desc: "We cultivate spaces where people lift each other up."                   },
  { Icon: Zap,      title: "Intentional Speed",     desc: "We ship thoughtfully, choosing quality over the dopamine of velocity."  },
];

const TEAM = [
  { initials: "AL", name: "Arjun Lim",     role: "Co-founder & CEO"      },
  { initials: "SM", name: "Sofia Morales", role: "Head of Product Design" },
  { initials: "KT", name: "Kai Tanaka",    role: "Lead Engineer"          },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function AboutPage() {
  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroLogo}>
          <Logo size={52} />
        </div>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>About VitaminA</h1>
          <p className={styles.heroSubtitle}>
            Your healthy dose of connection — social media as it should be.
          </p>
        </div>
        <div className={styles.heroDots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </section>

      {/* ── Mission ── */}
      <section className={styles.missionSection}>
        <div className={styles.missionText}>
          <span className={styles.sectionTag}>Our Mission</span>
          <h2 className={styles.sectionTitle}>
            Bringing healthy,<br />mindful communication<br />back to social media.
          </h2>
          <p className={styles.sectionBody}>
            Social media was supposed to connect us. Instead, it left many of us anxious,
            comparing, and doomscrolling into the early hours. VitaminA was born out of a
            simple conviction: technology should nourish, not deplete.
          </p>
          <p className={styles.sectionBody}>
            We built this platform around the idea that every post, every message, every
            interaction can be an act of care — a small vitamin for the soul.
          </p>
        </div>

        <div className={styles.missionCard}>
          <span className={styles.missionCardQuote}>"</span>
          <p className={styles.missionCardText}>
            Connection is not a commodity. It's the most human thing we do.
          </p>
          <div className={styles.missionCardAccent} />
        </div>
      </section>

      {/* ── Why VitaminA ── */}
      <section className={styles.whySection}>
        <div className={styles.whyHeader}>
          <span className={styles.sectionTag}>Why VitaminA?</span>
          <h2 className={styles.sectionTitle}>Built differently, on purpose.</h2>
        </div>

        <div className={styles.whyGrid}>
          {WHY_ITEMS.map(({ Icon, title, desc }) => (
            <div key={title} className={styles.whyCard}>
              <div className={styles.whyIconWrap}>
                <Icon size={22} strokeWidth={1.7} />
              </div>
              <h3 className={styles.whyCardTitle}>{title}</h3>
              <p className={styles.whyCardDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Values ── */}
      <section className={styles.valuesSection}>
        <div className={styles.valuesHeader}>
          <span className={styles.sectionTag}>Our Values</span>
          <h2 className={styles.sectionTitle}>The principles we live by.</h2>
        </div>

        <div className={styles.valuesGrid}>
          {VALUES.map(({ Icon, title, desc }) => (
            <div key={title} className={styles.valueCard}>
              <Icon size={20} strokeWidth={1.8} className={styles.valueIcon} />
              <h3 className={styles.valueTitle}>{title}</h3>
              <p className={styles.valueDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Team ── */}
      <section className={styles.teamSection}>
        <div className={styles.teamHeader}>
          <span className={styles.sectionTag}>The Team</span>
          <h2 className={styles.sectionTitle}>The humans behind the pill.</h2>
          <p className={styles.teamSubtitle}>
            A small, remote-first crew united by a shared belief in kinder technology.
          </p>
        </div>

        <div className={styles.teamGrid}>
          {TEAM.map(({ initials, name, role }) => (
            <div key={name} className={styles.teamCard}>
              <div className={styles.teamAvatar}>
                <span className={styles.teamAvatarText}>{initials}</span>
              </div>
              <h3 className={styles.teamName}>{name}</h3>
              <p className={styles.teamRole}>{role}</p>
            </div>
          ))}
        </div>

        <div className={styles.teamFooter}>
          <Globe size={16} strokeWidth={1.8} />
          <span>Remote-first — building from everywhere</span>
        </div>
      </section>

    </div>
  );
}