import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/useStore";
import { AlertCircle, Crown, Eye, EyeOff, LogIn } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { SiWhatsapp } from "react-icons/si";

export function LoginPage() {
  const login = useStore((s) => s.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Small delay for UX
    await new Promise((r) => setTimeout(r, 400));

    const success = login(username, password);
    if (!success) {
      setError("Invalid username or password. Please try again.");
    }
    setIsLoading(false);
  };

  const handleWhatsApp = () => {
    window.open("https://wa.me/919999999999?text=GET%20ID", "_blank");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5"
          style={{
            background:
              "radial-gradient(circle, oklch(var(--gold)), transparent)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-5"
          style={{
            background:
              "radial-gradient(circle, oklch(var(--back)), transparent)",
            filter: "blur(60px)",
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(var(--gold)) 1px, transparent 1px), linear-gradient(90deg, oklch(var(--gold)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo/Brand */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-center mb-8"
        >
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 gold-glow"
            style={{
              background:
                "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--accent)))",
            }}
          >
            <Crown className="w-8 h-8 text-background" />
          </div>
          <h1 className="text-4xl font-bold text-gold tracking-tight font-display">
            KINGBET
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Premium Betting Exchange
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-8 shadow-2xl"
          style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-sm font-medium text-muted-foreground"
              >
                Username
              </Label>
              <Input
                id="username"
                data-ocid="login.input"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-gold focus:ring-gold/30 h-11"
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-muted-foreground"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  data-ocid="login.password_input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-gold focus:ring-gold/30 h-11 pr-11"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2"
                data-ocid="login.error_state"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              data-ocid="login.submit_button"
              disabled={isLoading}
              className="w-full h-11 font-semibold text-background"
              style={{
                background: isLoading
                  ? "oklch(var(--muted))"
                  : "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--accent)))",
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </div>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">New user?</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* WhatsApp Get ID */}
          <button
            type="button"
            data-ocid="login.whatsapp_button"
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-green-700/40 bg-green-950/30 hover:bg-green-900/40 text-green-400 hover:text-green-300 transition-all duration-200 px-4 py-3 text-sm font-medium group"
          >
            <SiWhatsapp className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="font-semibold">Get ID via WhatsApp</div>
              <div className="text-xs text-green-500/70">
                Register and receive your account credentials
              </div>
            </div>
          </button>
        </motion.div>

        {/* Demo credentials hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-center"
        >
          <p className="text-xs text-muted-foreground">
            Demo: <span className="text-gold/80">user1 / pass123</span>{" "}
            &nbsp;|&nbsp;
            <span className="text-gold/80">admin1 / admin123</span>
          </p>
        </motion.div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground/50">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold/70 transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
