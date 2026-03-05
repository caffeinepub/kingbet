import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Market, Page, SportType } from "@/store/useStore";
import { useStore } from "@/store/useStore";
import { fetchPreviewEvents } from "@/utils/oddsService";
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

const SPORT_ICONS: Record<SportType, string> = {
  cricket: "🏏",
  football: "⚽",
  tennis: "🎾",
};

const SPORT_COLORS: Record<SportType, string> = {
  cricket: "oklch(var(--saffron))",
  football: "oklch(0.55 0.18 240)",
  tennis: "oklch(0.72 0.18 60)",
};

// Fallback mock cards when API returns empty
const FALLBACK_MARKETS = [
  {
    id: "fallback-1",
    sport: "cricket" as SportType,
    eventName: "IND vs AUS — 3rd Test",
    description: "MCG • Day 2",
    featured: true,
    selections: [
      {
        id: "f1-1",
        name: "India",
        backOdds: 1.85,
        layOdds: 1.87,
        backVolume: 2400000,
        layVolume: 1800000,
      },
      {
        id: "f1-2",
        name: "Australia",
        backOdds: 2.1,
        layOdds: 2.12,
        backVolume: 2100000,
        layVolume: 1600000,
      },
      {
        id: "f1-3",
        name: "Draw",
        backOdds: 3.5,
        layOdds: 3.55,
        backVolume: 800000,
        layVolume: 600000,
      },
    ],
    status: "open" as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    sport: "football" as SportType,
    eventName: "Man City vs Arsenal",
    description: "EPL • Matchday 30",
    featured: false,
    selections: [
      {
        id: "f2-1",
        name: "Man City",
        backOdds: 1.65,
        layOdds: 1.67,
        backVolume: 1800000,
        layVolume: 1400000,
      },
      {
        id: "f2-2",
        name: "Arsenal",
        backOdds: 2.4,
        layOdds: 2.42,
        backVolume: 1200000,
        layVolume: 900000,
      },
      {
        id: "f2-3",
        name: "Draw",
        backOdds: 3.2,
        layOdds: 3.25,
        backVolume: 700000,
        layVolume: 500000,
      },
    ],
    status: "open" as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-3",
    sport: "tennis" as SportType,
    eventName: "Djokovic vs Alcaraz",
    description: "Wimbledon Final",
    featured: false,
    selections: [
      {
        id: "f3-1",
        name: "Djokovic",
        backOdds: 1.75,
        layOdds: 1.77,
        backVolume: 3100000,
        layVolume: 2400000,
      },
      {
        id: "f3-2",
        name: "Alcaraz",
        backOdds: 2.05,
        layOdds: 2.07,
        backVolume: 2800000,
        layVolume: 2100000,
      },
    ],
    status: "open" as const,
    createdAt: new Date().toISOString(),
  },
];

function formatPreviewVolume(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

function LiveSportsPreview({ setPage }: { setPage: (page: Page) => void }) {
  const [previewMarkets, setPreviewMarkets] = useState<Market[] | null>(null);
  const [isApiData, setIsApiData] = useState(false);

  useEffect(() => {
    fetchPreviewEvents(3)
      .then((markets) => {
        if (markets.length > 0) {
          setPreviewMarkets(markets);
          setIsApiData(true);
        } else {
          setPreviewMarkets(FALLBACK_MARKETS as unknown as Market[]);
          setIsApiData(false);
        }
      })
      .catch(() => {
        setPreviewMarkets(FALLBACK_MARKETS as unknown as Market[]);
        setIsApiData(false);
      });
  }, []);

  const displayMarkets = previewMarkets ?? null;

  return (
    <section id="sports" className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          title="Live Sports Markets"
          subtitle="Back or Lay on your favourite teams with real-time exchange odds"
        />

        {/* API data badge */}
        {isApiData && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border"
              style={{
                background: "oklch(0.55 0.18 240 / 0.12)",
                color: "oklch(0.55 0.18 240)",
                borderColor: "oklch(0.55 0.18 240 / 0.3)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse inline-block" />
              Live odds via TheOddsAPI
            </span>
          </motion.div>
        )}

        <div className="grid md:grid-cols-3 gap-5">
          {displayMarkets === null
            ? // Loading skeletons
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border overflow-hidden"
                  style={{ background: "oklch(var(--card))" }}
                >
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Skeleton className="w-6 h-6 rounded" />
                      <div className="space-y-1.5">
                        <Skeleton className="w-20 h-3" />
                        <Skeleton className="w-36 h-4" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    {[0, 1, 2].map((j) => (
                      <div key={j} className="flex items-center gap-2">
                        <Skeleton className="flex-1 h-4" />
                        <Skeleton className="w-14 h-8 rounded" />
                        <Skeleton className="w-14 h-8 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            : displayMarkets.slice(0, 3).map((market, i) => {
                const isFeatured = i === 0;
                const totalVol = market.selections.reduce(
                  (s, sel) => s + sel.backVolume,
                  0,
                );
                return (
                  <motion.div
                    key={market.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`rounded-xl border overflow-hidden transition-all duration-300 hover:translate-y-[-3px] ${
                      isFeatured
                        ? "border-saffron/40 shadow-lg"
                        : "border-border hover:border-gold/30"
                    }`}
                    style={{
                      background: "oklch(var(--card))",
                      boxShadow: isFeatured
                        ? "0 8px 32px oklch(var(--saffron) / 0.15)"
                        : undefined,
                    }}
                    data-ocid={`sports.market_card.${i + 1}`}
                  >
                    {isFeatured && (
                      <div
                        className="text-center py-1.5 text-xs font-bold tracking-wider text-background"
                        style={{
                          background:
                            "linear-gradient(90deg, oklch(var(--saffron)), oklch(var(--gold)))",
                        }}
                      >
                        ⭐ FEATURED MATCH
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {SPORT_ICONS[market.sport]}
                          </span>
                          <div>
                            <p
                              className="text-xs font-semibold"
                              style={{ color: SPORT_COLORS[market.sport] }}
                            >
                              {market.description}
                            </p>
                            <p className="text-sm font-bold text-foreground">
                              {market.eventName}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            className="text-[10px] font-bold"
                            style={{
                              background: "oklch(0.65 0.18 145 / 0.2)",
                              color: "oklch(0.65 0.18 145)",
                              border: "1px solid oklch(0.65 0.18 145 / 0.4)",
                            }}
                          >
                            ● LIVE
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            Vol: {formatPreviewVolume(totalVol)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="grid grid-cols-[1fr_64px_64px] gap-1 text-[10px] text-center">
                          <div />
                          <div
                            style={{ color: "oklch(var(--back))" }}
                            className="font-bold"
                          >
                            BACK
                          </div>
                          <div
                            style={{ color: "oklch(var(--lay))" }}
                            className="font-bold"
                          >
                            LAY
                          </div>
                        </div>
                        {market.selections.slice(0, 3).map((sel) => (
                          <div
                            key={sel.id}
                            className="grid grid-cols-[1fr_64px_64px] gap-1 items-center"
                          >
                            <span className="text-xs text-foreground font-medium truncate">
                              {sel.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => setPage("login")}
                              className="rounded py-1.5 text-xs font-bold font-mono transition-all hover:brightness-110"
                              style={{
                                background: "oklch(var(--back) / 0.15)",
                                color: "oklch(var(--back))",
                                border: "1px solid oklch(var(--back) / 0.3)",
                              }}
                            >
                              {sel.backOdds.toFixed(2)}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPage("login")}
                              className="rounded py-1.5 text-xs font-bold font-mono transition-all hover:brightness-110"
                              style={{
                                background: "oklch(var(--lay) / 0.15)",
                                color: "oklch(var(--lay))",
                                border: "1px solid oklch(var(--lay) / 0.3)",
                              }}
                            >
                              {sel.layOdds.toFixed(2)}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
        </div>

        <div className="text-center mt-8">
          <Button
            onClick={() => setPage("login")}
            variant="outline"
            className="border-gold/40 text-gold hover:bg-gold/10"
            data-ocid="sports.view_all_button"
          >
            View All Markets
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </section>
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
