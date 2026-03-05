import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Page } from "@/store/useStore";
import { useStore } from "@/store/useStore";
import {
  ChevronRight,
  Crown,
  Shield,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SiInstagram, SiTelegram, SiWhatsapp, SiX } from "react-icons/si";

const WHATSAPP_URL =
  "https://wa.me/919999999999?text=Hi%2C%20I%20want%20to%20get%20my%20KINGBET%20ID";

// Animated multiplier for Aviator preview
function AviatorMultiplier() {
  const [value, setValue] = useState(1.0);
  const [crashed, setCrashed] = useState(false);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const targetRef = useRef<number>(2.5 + Math.random() * 3);

  const crashedRef = useRef(crashed);
  crashedRef.current = crashed;

  useEffect(() => {
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const mult = Math.exp(0.00008 * elapsed);
      if (mult >= targetRef.current) {
        setCrashed(true);
        setValue(targetRef.current);
        setTimeout(() => {
          setCrashed(false);
          setValue(1.0);
          startRef.current = 0;
          targetRef.current = 2.5 + Math.random() * 4;
        }, 1800);
        return;
      }
      setValue(mult);
      if (!crashedRef.current) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    if (!crashedRef.current) {
      frameRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="text-center">
      <div
        className={`text-4xl font-bold font-mono transition-colors duration-300 ${
          crashed ? "text-rose-400" : "text-green-400"
        }`}
      >
        {value.toFixed(2)}x
      </div>
      <div
        className={`text-xs mt-1 font-semibold ${crashed ? "text-rose-400" : "text-muted-foreground"}`}
      >
        {crashed ? "CRASHED!" : "FLYING..."}
      </div>
    </div>
  );
}

// Stat ticker
const STATS = [
  "₹2.5Cr+ Daily Volume",
  "50K+ Active Users",
  "99.9% Uptime",
  "Instant Withdrawal",
  "500+ Live Markets",
  "24/7 Support",
];

function StatsTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % STATS.length), 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <Zap className="w-4 h-4 text-saffron shrink-0" />
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-sm font-semibold text-foreground"
        >
          {STATS[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// Section header with gold underline
function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="text-center mb-10"
    >
      <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground inline-block relative">
        {title}
        <span
          className="absolute -bottom-2 left-0 right-0 h-0.5 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(var(--gold)), oklch(var(--saffron)), transparent)",
          }}
        />
      </h2>
      {subtitle && (
        <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

// ─── Diamond Exchange style static live sports data ───────────────────────────
const LIVE_SPORTS_TABLE = [
  {
    event: "India vs Australia",
    sport: "🏏",
    competition: "ICC World Cup 2026",
    odds1: "1.98",
    odds2: "2.02",
    oddsX: "-",
    status: "LIVE",
    time: "2nd Innings",
  },
  {
    event: "Man United vs Liverpool",
    sport: "⚽",
    competition: "Premier League",
    odds1: "2.50",
    oddsX: "3.20",
    odds2: "2.54",
    status: "LIVE",
    time: "67 min",
  },
  {
    event: "Djokovic vs Alcaraz",
    sport: "🎾",
    competition: "Australian Open",
    odds1: "1.65",
    odds2: "1.70",
    oddsX: "-",
    status: "LIVE",
    time: "Set 3",
  },
  {
    event: "England vs South Africa",
    sport: "🏏",
    competition: "Ashes 2026",
    odds1: "1.75",
    odds2: "1.79",
    oddsX: "-",
    status: "Soon",
    time: "Starts 3:00 PM",
  },
  {
    event: "Arsenal vs Chelsea",
    sport: "⚽",
    competition: "FA Cup",
    odds1: "1.90",
    oddsX: "3.40",
    odds2: "3.10",
    status: "Soon",
    time: "Starts 8:00 PM",
  },
  {
    event: "CSK vs MI",
    sport: "🏏",
    competition: "IPL 2026",
    odds1: "1.85",
    odds2: "1.95",
    oddsX: "-",
    status: "LIVE",
    time: "1st Innings",
  },
];

// ─── Sports categories grid data ──────────────────────────────────────────────
const SPORTS_CATEGORIES = [
  { name: "Cricket", icon: "🏏", count: "300+" },
  { name: "Football", icon: "⚽", count: "400+" },
  { name: "Tennis", icon: "🎾", count: "300+" },
  { name: "Basketball", icon: "🏀", count: "50+" },
  { name: "Horse Racing", icon: "🏇", count: "80+" },
  { name: "Kabaddi", icon: "🤼", count: "30+" },
];

function LiveSportsPreview({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <>
      {/* ── Diamond Exchange Live Markets Table ── */}
      <section
        id="sports"
        className="px-4 pb-6 pt-2 max-w-5xl mx-auto w-full"
        data-ocid="landing.sports_table.section"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live Markets
          </h2>
          <button
            type="button"
            onClick={() => setPage("login")}
            className="text-xs font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity"
            style={{ color: "oklch(var(--gold))" }}
          >
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Table */}
        <div
          className="rounded-lg border border-border overflow-hidden"
          style={{ background: "oklch(0.11 0.015 265)" }}
        >
          {/* Header row */}
          <div
            className="grid grid-cols-12 px-3 py-2 text-[10px] font-bold uppercase border-b border-border/50"
            style={{
              background: "oklch(0.09 0.01 265)",
              color: "oklch(var(--muted-foreground))",
            }}
          >
            <div className="col-span-5">Event</div>
            <div className="col-span-2 text-center">1</div>
            <div className="col-span-2 text-center">X</div>
            <div className="col-span-2 text-center">2</div>
            <div className="col-span-1" />
          </div>

          {/* Match rows */}
          {LIVE_SPORTS_TABLE.map((m, _i) => (
            <button
              key={m.event}
              type="button"
              onClick={() => setPage("login")}
              className="grid grid-cols-12 items-center w-full px-3 py-2.5 border-b border-border/30 last:border-0 text-left transition-colors duration-100"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "oklch(0.13 0.018 265)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
            >
              {/* Event info */}
              <div className="col-span-5 flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">{m.sport}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate leading-tight">
                    {m.event}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] text-muted-foreground/70 truncate">
                      {m.competition}
                    </span>
                    <span
                      className="text-[9px] font-bold shrink-0"
                      style={{
                        color:
                          m.status === "LIVE"
                            ? "oklch(0.65 0.18 145)"
                            : "oklch(var(--gold))",
                      }}
                    >
                      {m.status === "LIVE" ? `• ${m.time}` : m.time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Back / Lagao */}
              <div className="col-span-2 flex justify-center px-0.5">
                <div
                  className="flex flex-col items-center justify-center h-10 w-full rounded text-center transition-all hover:brightness-110"
                  style={{
                    background: "oklch(0.55 0.18 240 / 0.18)",
                    border: "1px solid oklch(0.55 0.18 240 / 0.35)",
                  }}
                >
                  <span
                    className="text-[11px] font-bold font-mono leading-none"
                    style={{ color: "oklch(0.75 0.18 240)" }}
                  >
                    {m.odds1}
                  </span>
                  <span
                    className="text-[8px] mt-0.5 font-semibold"
                    style={{ color: "oklch(0.75 0.18 240 / 0.65)" }}
                  >
                    Lagao
                  </span>
                </div>
              </div>

              {/* Draw / X */}
              <div className="col-span-2 flex justify-center px-0.5">
                {m.oddsX && m.oddsX !== "-" ? (
                  <div
                    className="flex flex-col items-center justify-center h-10 w-full rounded text-center transition-all hover:brightness-110"
                    style={{
                      background: "oklch(0.55 0.18 240 / 0.18)",
                      border: "1px solid oklch(0.55 0.18 240 / 0.35)",
                    }}
                  >
                    <span
                      className="text-[11px] font-bold font-mono leading-none"
                      style={{ color: "oklch(0.75 0.18 240)" }}
                    >
                      {m.oddsX}
                    </span>
                    <span
                      className="text-[8px] mt-0.5 font-semibold"
                      style={{ color: "oklch(0.75 0.18 240 / 0.65)" }}
                    >
                      Lagao
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground/40 text-xs self-center">
                    —
                  </span>
                )}
              </div>

              {/* Lay / Khai */}
              <div className="col-span-2 flex justify-center px-0.5">
                <div
                  className="flex flex-col items-center justify-center h-10 w-full rounded text-center transition-all hover:brightness-110"
                  style={{
                    background: "oklch(0.62 0.22 20 / 0.18)",
                    border: "1px solid oklch(0.62 0.22 20 / 0.35)",
                  }}
                >
                  <span
                    className="text-[11px] font-bold font-mono leading-none"
                    style={{ color: "oklch(0.75 0.22 20)" }}
                  >
                    {m.odds2}
                  </span>
                  <span
                    className="text-[8px] mt-0.5 font-semibold"
                    style={{ color: "oklch(0.75 0.22 20 / 0.65)" }}
                  >
                    Khai
                  </span>
                </div>
              </div>

              {/* Live indicator */}
              <div className="col-span-1 flex justify-center">
                {m.status === "LIVE" && (
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Sports Categories Grid ── */}
      <section className="px-4 pb-12 max-w-5xl mx-auto w-full">
        <h2
          className="text-sm font-bold mb-3 flex items-center gap-2"
          style={{ color: "oklch(var(--foreground))" }}
        >
          <span style={{ color: "oklch(var(--gold))" }}>🌐</span> All Sports
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {SPORTS_CATEGORIES.map((s, i) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setPage("login")}
              data-ocid={`landing.sport_card.${i + 1}`}
              className="rounded-lg p-3.5 text-center transition-all duration-200 border border-border hover:border-yellow-500/40 group"
              style={{ background: "oklch(0.11 0.015 265)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "oklch(0.13 0.018 265)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "oklch(0.11 0.015 265)";
              }}
            >
              <div className="text-2xl mb-1.5">{s.icon}</div>
              <p className="text-[11px] font-bold text-foreground">{s.name}</p>
              <p
                className="text-[10px] font-semibold mt-0.5"
                style={{ color: "oklch(var(--gold))" }}
              >
                {s.count} markets
              </p>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

export function LandingPage() {
  const setPage = useStore((s) => s.setPage);
  const [lang, setLang] = useState<"en" | "hi">("en");

  const navLabels = {
    en: {
      sports: "Sports",
      casino: "Casino",
      crash: "Crash Games",
      faq: "FAQ",
    },
    hi: { sports: "खेल", casino: "कैसीनो", crash: "क्रैश गेम्स", faq: "सहायता" },
  };
  const labels = navLabels[lang];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Promo Ticker ── */}
      <div
        className="w-full py-1.5 px-4 text-center text-xs font-medium overflow-hidden"
        style={{
          background:
            "linear-gradient(90deg, oklch(var(--saffron) / 0.2), oklch(var(--gold) / 0.2), oklch(var(--saffron) / 0.2))",
          borderBottom: "1px solid oklch(var(--saffron) / 0.2)",
        }}
      >
        <span className="text-saffron">🏏 IPL 2026 LIVE</span>
        <span className="mx-3 text-border">|</span>
        <span className="text-gold">₹500 Welcome Bonus</span>
        <span className="mx-3 text-border">|</span>
        <span className="text-foreground/70">Fast Withdrawals</span>
        <span className="mx-3 text-border">|</span>
        <span className="text-foreground/70">24/7 Support</span>
      </div>

      {/* ── Sticky Header ── */}
      <header
        className="sticky top-0 z-50 border-b border-border backdrop-blur-md"
        style={{ background: "oklch(var(--card) / 0.90)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center gold-glow"
              style={{
                background:
                  "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
              }}
            >
              <Crown className="w-4 h-4 text-background" />
            </div>
            <span className="text-xl font-bold text-gold font-display tracking-tight">
              KINGBET
            </span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
            {[
              { label: labels.sports, id: "sports" },
              { label: labels.casino, id: "casino" },
              { label: labels.crash, id: "crash" },
              { label: labels.faq, id: "faq" },
            ].map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="hover:text-gold transition-colors"
                data-ocid={`nav.${item.id}.link`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="hidden sm:flex items-center gap-1 text-xs border border-border rounded-full px-2.5 py-1 text-muted-foreground hover:text-gold hover:border-gold/50 transition-all"
              data-ocid="nav.lang_toggle"
            >
              {lang === "en" ? "हि" : "EN"}
            </button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage("login")}
              className="border-gold/40 text-gold hover:bg-gold/10 hover:border-gold/60 transition-all"
              data-ocid="nav.login_button"
            >
              Login
            </Button>

            <Button
              size="sm"
              onClick={() => window.open(WHATSAPP_URL, "_blank")}
              className="hidden sm:flex text-background font-semibold"
              style={{
                background:
                  "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
              }}
              data-ocid="nav.get_id_button"
            >
              <SiWhatsapp className="w-3.5 h-3.5 mr-1.5" />
              Get ID
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 50%, oklch(var(--saffron) / 0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, oklch(var(--gold) / 0.10) 0%, transparent 55%), oklch(var(--background))",
            }}
          />
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle, oklch(var(--gold)) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* Diagonal stripe */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, oklch(var(--saffron)), oklch(var(--saffron)) 1px, transparent 1px, transparent 40px)",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left — Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Badge
                  className="mb-5 border-saffron/40 text-saffron text-xs font-semibold px-3 py-1"
                  variant="outline"
                  style={{ background: "oklch(var(--saffron) / 0.10)" }}
                >
                  🏆 India's #1 Betting Exchange
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-7xl font-bold font-hero leading-none mb-4"
                style={{ letterSpacing: "-0.02em" }}
              >
                <span className="text-foreground">Bet.</span>
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Win Big.
                </span>
                <br />
                <span className="text-foreground">Exchange.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-lg mb-6 max-w-md leading-relaxed"
              >
                Real-time odds. Secure ICP blockchain. Instant INR settlements.
                Cricket, Football, Tennis and Live Casino — all in one platform.
              </motion.p>

              {/* Stats ticker */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-3 mb-8 rounded-lg border border-border bg-card/60 px-4 py-3 w-fit"
              >
                <StatsTicker />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Button
                  size="lg"
                  onClick={() => setPage("login")}
                  className="text-background font-bold text-base px-8 h-12"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
                    boxShadow: "0 4px 24px oklch(var(--gold) / 0.3)",
                  }}
                  data-ocid="hero.login_button"
                >
                  Login & Bet Now
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => window.open(WHATSAPP_URL, "_blank")}
                  className="border-green-700/50 text-green-400 hover:bg-green-950/30 h-12 px-6 font-semibold"
                  data-ocid="hero.whatsapp_button"
                >
                  <SiWhatsapp className="w-5 h-5 mr-2" />
                  Get Betting ID
                </Button>
              </motion.div>
            </div>

            {/* Right — Live Preview Cards */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden md:block"
            >
              <div className="space-y-3">
                {/* Cricket match card */}
                <div
                  className="rounded-xl border p-4 backdrop-blur-sm"
                  style={{
                    borderColor: "oklch(var(--saffron) / 0.3)",
                    background: "oklch(var(--card) / 0.8)",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏏</span>
                      <div>
                        <p className="text-xs text-saffron font-semibold">
                          Cricket • IPL 2026
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          Mumbai Indians vs CSK
                        </p>
                      </div>
                    </div>
                    <Badge
                      className="text-[10px] font-bold animate-pulse"
                      style={{
                        background: "oklch(0.65 0.18 145 / 0.2)",
                        color: "oklch(0.65 0.18 145)",
                        border: "1px solid oklch(0.65 0.18 145 / 0.4)",
                      }}
                    >
                      ● LIVE
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {[
                      { name: "MI", back: "1.92", lay: "1.94" },
                      { name: "CSK", back: "2.10", lay: "2.12" },
                      { name: "Draw", back: "12.0", lay: "13.0" },
                    ].map((sel) => (
                      <div
                        key={sel.name}
                        className="rounded-lg overflow-hidden border border-border/50"
                      >
                        <div className="py-1 text-muted-foreground font-medium bg-secondary/50">
                          {sel.name}
                        </div>
                        <div className="grid grid-cols-2">
                          <div
                            className="py-1.5 font-bold font-mono"
                            style={{
                              color: "oklch(var(--back))",
                              background: "oklch(var(--back) / 0.1)",
                            }}
                          >
                            {sel.back}
                          </div>
                          <div
                            className="py-1.5 font-bold font-mono"
                            style={{
                              color: "oklch(var(--lay))",
                              background: "oklch(var(--lay) / 0.1)",
                            }}
                          >
                            {sel.lay}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Casino + Crash mini row */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-xl border p-3 text-center"
                    style={{
                      borderColor: "oklch(var(--gold) / 0.3)",
                      background: "oklch(var(--card) / 0.8)",
                    }}
                  >
                    <div className="text-2xl mb-1">🃏</div>
                    <p className="text-xs font-semibold text-gold">
                      Teen Patti
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Live Now
                    </p>
                  </div>
                  <div
                    className="rounded-xl border p-3 text-center"
                    style={{
                      borderColor: "oklch(var(--saffron) / 0.3)",
                      background: "oklch(var(--card) / 0.8)",
                    }}
                  >
                    <AviatorMultiplier />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Aviator
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Live Sports Preview ── */}
      <LiveSportsPreview setPage={setPage} />

      {/* ── Live Casino Preview ── */}
      <section
        id="casino"
        className="py-16 px-4"
        style={{ background: "oklch(var(--card) / 0.4)" }}
      >
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Live Casino"
            subtitle="Real-time multiplayer casino games powered by ICP blockchain"
          />

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: "🎰",
                name: "European Roulette",
                desc: "Place bets on numbers, colors, and combinations",
                players: "342",
                badge: "Live",
                badgeColor: "oklch(0.65 0.18 145)",
                accent: "oklch(var(--gold))",
              },
              {
                icon: "🃏",
                name: "Teen Patti",
                desc: "India's favourite card game — 3 cards, pure excitement",
                players: "891",
                badge: "🔥 Hot",
                badgeColor: "oklch(var(--saffron))",
                accent: "oklch(var(--saffron))",
                featured: true,
              },
              {
                icon: "🎴",
                name: "Andar Bahar",
                desc: "Simple, fast-paced Indian card game with big payouts",
                players: "567",
                badge: "Live",
                badgeColor: "oklch(0.65 0.18 145)",
                accent: "oklch(var(--saffron))",
              },
            ].map((game, i) => (
              <motion.div
                key={game.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, translateY: -4 }}
                className={`rounded-xl border p-6 cursor-pointer transition-all duration-300 ${
                  game.featured
                    ? "border-saffron/40"
                    : "border-border hover:border-gold/30"
                }`}
                style={{
                  background: "oklch(var(--card))",
                  boxShadow: game.featured
                    ? "0 8px 32px oklch(var(--saffron) / 0.15)"
                    : "0 4px 16px rgba(0,0,0,0.2)",
                }}
                onClick={() => setPage("login")}
              >
                <div className="text-4xl mb-3">{game.icon}</div>
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className="font-bold text-foreground text-lg"
                    style={{ color: game.accent }}
                  >
                    {game.name}
                  </h3>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${game.badgeColor}22`,
                      color: game.badgeColor,
                      border: `1px solid ${game.badgeColor}44`,
                    }}
                  >
                    {game.badge}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {game.desc}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    👥 {game.players} playing
                  </span>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPage("login");
                    }}
                    className="text-background font-semibold text-xs h-7 px-3"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
                    }}
                    data-ocid={`casino.play_button.${i + 1}`}
                  >
                    Play Now
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Crash Games Preview ── */}
      <section id="crash" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Crash Games"
            subtitle="Provably fair — cash out before the crash and multiply your stake"
          />

          <div className="grid md:grid-cols-3 gap-5">
            {/* Aviator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="rounded-xl border border-saffron/30 overflow-hidden"
              style={{
                background: "oklch(var(--card))",
                boxShadow: "0 8px 32px oklch(var(--saffron) / 0.1)",
              }}
            >
              <div
                className="p-6 pb-4"
                style={{
                  background:
                    "linear-gradient(180deg, oklch(var(--saffron) / 0.08), transparent)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-foreground text-lg">
                      ✈️ Aviator
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Crash & Cash Out
                    </p>
                  </div>
                  <Badge
                    className="text-[10px] font-bold"
                    style={{
                      background: "oklch(var(--saffron) / 0.2)",
                      color: "oklch(var(--saffron))",
                      border: "1px solid oklch(var(--saffron) / 0.4)",
                    }}
                  >
                    🔥 #1 Game
                  </Badge>
                </div>
                <div
                  className="rounded-lg p-4 flex items-center justify-center"
                  style={{ background: "oklch(var(--background) / 0.6)" }}
                >
                  <AviatorMultiplier />
                </div>
              </div>
              <div className="p-4 pt-2">
                <p className="text-sm text-muted-foreground mb-3">
                  Watch the multiplier soar — cash out before it crashes!
                  Auto-cashout available.
                </p>
                <Button
                  className="w-full font-bold text-background"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
                  }}
                  onClick={() => setPage("login")}
                  data-ocid="crash.aviator_button"
                >
                  Play Aviator
                </Button>
              </div>
            </motion.div>

            {/* Plinko */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border hover:border-gold/30 overflow-hidden transition-all duration-300"
              style={{ background: "oklch(var(--card))" }}
            >
              <div className="p-6">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="font-bold text-foreground text-lg mb-1">
                  Plinko
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drop the ball, watch it bounce through pegs and land in
                  high-multiplier slots.
                </p>
                <div
                  className="rounded-lg p-4 mb-4 flex items-center justify-center gap-2"
                  style={{ background: "oklch(var(--secondary))" }}
                >
                  {(
                    [
                      "1000x",
                      "88x",
                      "33x",
                      "11x",
                      "5x",
                      "3x",
                      "1x",
                      "3x-end",
                    ] as const
                  ).map((m) => {
                    const isEdge = m === "1000x" || m === "3x-end";
                    const label = m === "3x-end" ? "3x" : m;
                    return (
                      <div
                        key={m}
                        className="text-[10px] font-bold px-1 py-0.5 rounded"
                        style={{
                          background: isEdge
                            ? "oklch(var(--gold) / 0.3)"
                            : "oklch(var(--muted))",
                          color: isEdge
                            ? "oklch(var(--gold))"
                            : "oklch(var(--muted-foreground))",
                        }}
                      >
                        {label}
                      </div>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  className="w-full border-gold/40 text-gold hover:bg-gold/10"
                  onClick={() => setPage("login")}
                  data-ocid="crash.plinko_button"
                >
                  Play Plinko
                </Button>
              </div>
            </motion.div>

            {/* Dice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-border hover:border-gold/30 overflow-hidden transition-all duration-300"
              style={{ background: "oklch(var(--card))" }}
            >
              <div className="p-6">
                <div className="text-4xl mb-3">🎲</div>
                <h3 className="font-bold text-foreground text-lg mb-1">Dice</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Predict Over/Under on a roll. Simple, fast, configurable odds
                  from 1.01x to 99x.
                </p>
                <div
                  className="rounded-lg p-4 mb-4 text-center"
                  style={{ background: "oklch(var(--secondary))" }}
                >
                  <p className="text-xs text-muted-foreground mb-2">
                    ROLL OVER
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl font-bold text-gold font-mono">
                      50.5
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Win chance: 49.5%
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-bold text-green-400">
                    Payout: 1.98x
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-gold/40 text-gold hover:bg-gold/10"
                  onClick={() => setPage("login")}
                  data-ocid="crash.dice_button"
                >
                  Play Dice
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Why KINGBET ── */}
      <section
        className="py-16 px-4"
        style={{ background: "oklch(var(--card) / 0.4)" }}
      >
        <div className="max-w-7xl mx-auto">
          <SectionHeader title="Why Choose KINGBET" />

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              {
                icon: TrendingUp,
                title: "Real-Time Exchange",
                desc: "Back & Lay engine with live order matching. Get the best odds instantly.",
                color: "oklch(var(--back))",
              },
              {
                icon: Shield,
                title: "ICP Blockchain",
                desc: "Powered by Internet Computer Protocol — tamper-proof, transparent, and trustless.",
                color: "oklch(var(--gold))",
              },
              {
                icon: Wallet,
                title: "Instant INR Settlement",
                desc: "Winnings credited in seconds. Withdraw anytime, no delays.",
                color: "oklch(0.65 0.18 145)",
              },
              {
                icon: Crown,
                title: "Admin Credit System",
                desc: "Trusted credit-based system managed by admins — no KYC hassle.",
                color: "oklch(var(--saffron))",
              },
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-xl border border-border p-5 hover:border-gold/30 transition-all duration-300 hover:translate-y-[-2px]"
                  style={{ background: "oklch(var(--card))" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${feat.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: feat.color }} />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feat.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            title="How It Works"
            subtitle="Get started in 3 simple steps"
          />

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div
              className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px"
              style={{
                background:
                  "linear-gradient(90deg, oklch(var(--gold) / 0.3), oklch(var(--saffron) / 0.3))",
              }}
            />

            {[
              {
                step: "01",
                title: "Get Your ID",
                desc: 'Click "Get Betting ID" and message us on WhatsApp. We\'ll create your account within minutes.',
                icon: SiWhatsapp,
                color: "oklch(var(--saffron))",
              },
              {
                step: "02",
                title: "Add Funds",
                desc: "Contact your admin to deposit funds via UPI, bank transfer, or cash. Balance credited instantly.",
                icon: Wallet,
                color: "oklch(var(--gold))",
              },
              {
                step: "03",
                title: "Start Betting",
                desc: "Login with your ID. Choose any sport, casino game, or crash game and start winning!",
                icon: TrendingUp,
                color: "oklch(0.65 0.18 145)",
              },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="text-center relative"
                >
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 relative z-10"
                    style={{
                      background: `${step.color}18`,
                      border: `2px solid ${step.color}40`,
                    }}
                  >
                    <Icon className="w-8 h-8" style={{ color: step.color }} />
                    <div
                      className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-background text-xs font-bold"
                      style={{ background: step.color }}
                    >
                      {step.step}
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-10"
          >
            <Button
              size="lg"
              onClick={() => window.open(WHATSAPP_URL, "_blank")}
              className="text-white font-bold px-8"
              style={{
                background: "#25D366",
                boxShadow: "0 4px 20px #25D36640",
              }}
              data-ocid="howitworks.get_id_button"
            >
              <SiWhatsapp className="w-5 h-5 mr-2" />
              Get Your KINGBET ID Now
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section
        id="faq"
        className="py-16 px-4"
        style={{ background: "oklch(var(--card) / 0.4)" }}
      >
        <div className="max-w-3xl mx-auto">
          <SectionHeader title="Frequently Asked Questions" />

          <Accordion type="single" collapsible className="space-y-2">
            {[
              {
                q: "How do I register on KINGBET?",
                a: 'KINGBET uses an admin-controlled registration system. Click the "Get Betting ID" button and message us on WhatsApp. An admin will create your account and provide your login credentials within minutes.',
              },
              {
                q: "How do I deposit money?",
                a: "Contact your assigned admin via WhatsApp. We accept UPI, bank transfer, and cash deposits. Your balance will be credited immediately after payment confirmation. There are no deposit fees.",
              },
              {
                q: "How quickly are withdrawals processed?",
                a: "Withdrawals are processed instantly once approved by your admin. There are no holding periods. You can withdraw any time during working hours (9 AM – 11 PM IST).",
              },
              {
                q: "What is Back and Lay betting?",
                a: "KINGBET is a betting exchange. Back betting means you bet FOR a selection to win. Lay betting means you bet AGAINST a selection — acting as the bookmaker. Both types allow you to trade positions and lock in profits.",
              },
              {
                q: "Is my money safe on KINGBET?",
                a: "Yes. KINGBET runs on the Internet Computer Protocol (ICP) blockchain, which ensures all transactions are transparent and tamper-proof. Your balance and bet history are stored on-chain.",
              },
            ].map((faq) => (
              <AccordionItem
                key={faq.q}
                value={faq.q}
                className="rounded-xl border border-border overflow-hidden"
                style={{ background: "oklch(var(--card))" }}
              >
                <AccordionTrigger className="px-5 py-4 text-sm font-semibold text-foreground hover:text-gold hover:no-underline transition-colors">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-8 md:p-12 text-center relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(var(--card)), oklch(var(--secondary)))",
              border: "1px solid oklch(var(--saffron) / 0.3)",
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, oklch(var(--gold)) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-3">
                Ready to{" "}
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Win Big?
                </span>
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Join 50,000+ players on India's most trusted betting exchange.
                Get your ID today.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  onClick={() => setPage("login")}
                  className="text-background font-bold px-8"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
                  }}
                  data-ocid="cta.login_button"
                >
                  Login Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => window.open(WHATSAPP_URL, "_blank")}
                  className="border-green-700/50 text-green-400 hover:bg-green-950/30"
                  data-ocid="cta.whatsapp_button"
                >
                  <SiWhatsapp className="w-5 h-5 mr-2" />
                  Get Betting ID
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card">
        {/* Responsible gaming notice */}
        <div
          className="text-center py-3 px-4 text-xs text-muted-foreground border-b border-border/50"
          style={{ background: "oklch(var(--destructive) / 0.05)" }}
        >
          ⚠️ <strong className="text-foreground">Responsible Gaming:</strong>{" "}
          Gambling involves risk. Only bet what you can afford to lose. 18+
          only. If you have a gambling problem, seek help.
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
                  }}
                >
                  <Crown className="w-4 h-4 text-background" />
                </div>
                <span className="text-xl font-bold text-gold font-display">
                  KINGBET
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                India's #1 Betting Exchange powered by ICP blockchain. Fast,
                secure, and transparent.
              </p>
              {/* Social */}
              <div className="flex items-center gap-3 mt-4">
                {[
                  {
                    Icon: SiInstagram,
                    href: "https://instagram.com",
                    label: "Instagram",
                  },
                  {
                    Icon: SiTelegram,
                    href: "https://t.me/kingbet",
                    label: "Telegram",
                  },
                  {
                    Icon: SiX,
                    href: "https://x.com/kingbet",
                    label: "X/Twitter",
                  },
                  { Icon: SiWhatsapp, href: WHATSAPP_URL, label: "WhatsApp" },
                ].map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-gold/10 transition-all"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* About */}
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">
                About KINGBET
              </h4>
              <ul className="space-y-2">
                {["About Us", "How It Works", "Why KINGBET", "Blog"].map(
                  (link) => (
                    <li key={link}>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-gold transition-colors"
                        onClick={() => window.scrollTo(0, 0)}
                      >
                        {link}
                      </button>
                    </li>
                  ),
                )}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">
                Quick Links
              </h4>
              <ul className="space-y-2">
                {[
                  "Terms & Conditions",
                  "Privacy Policy",
                  "Responsible Gaming",
                  "Fair Play Policy",
                ].map((link) => (
                  <li key={link}>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-gold transition-colors"
                      onClick={() => window.scrollTo(0, 0)}
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">
                Support
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Available 24/7 for all your queries and support needs.
              </p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "#25D366" }}
                data-ocid="footer.whatsapp_button"
              >
                <SiWhatsapp className="w-4 h-4" />
                WhatsApp Support
              </a>
              <p className="text-xs text-muted-foreground mt-3">
                📧 support@kingbet.in
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                🕐 9 AM – 11 PM IST
              </p>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} KINGBET. All rights reserved. 18+
              only. Bet responsibly.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">
                Powered by{" "}
                <span className="text-gold font-semibold">
                  Internet Computer
                </span>
              </span>
              <span className="text-xs text-muted-foreground/50">|</span>
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground/50 hover:text-gold/60 transition-colors"
              >
                Built with ❤️ using caffeine.ai
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
