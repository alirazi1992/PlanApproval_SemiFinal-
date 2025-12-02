import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAuth,
  getHomePathForRole,
  UserRole,
} from "../features/auth/AuthContext";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";
import FallBeamBackground from "../components/common/FallBeamBackground"; // ⬅️ update path if needed

const safeHomePathForRole = (role?: UserRole | null) => {
  try {
    return getHomePathForRole(role ?? null);
  } catch {
    return "/";
  }
};

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const user = await login(email.trim(), password);
      const role = user?.role ?? null;
      const path = safeHomePathForRole(role);
      navigate(path);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("ورود ناموفق بود. لطفاً دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden"
      dir="rtl"
    >
      {/* Animated beam background */}
      <FallBeamBackground
        lineCount={28}
        beamColorClass="cyan-400"
        className=""
      />

      {/* Optional radial gradient overlay for more depth */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.28),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.22),_transparent_55%)]" />

      {/* Foreground content */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="w-full p-10 shadow-2xl text-right rounded-3xl bg-white/95 backdrop-blur-xl border border-white/30">
          <div className="mb-8">
            <p className="text-xs tracking-[0.4em] text-gray-500">
              ورود یکپارچه
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              با یک ورود، مسیر شما مشخص می‌شود
            </h1>
            <p className="text-gray-600 mt-2">
              فقط ایمیل و رمز عبور را وارد کنید و به داشبورد مخصوص هدایت
              می‌شوید.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="ایمیل سازمانی"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required
              dir="ltr"
            />

            <Input
              label="رمز عبور"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              required
              dir="ltr"
            />

            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="flex items-center gap-2">
                  <Icon name="alertTriangle" size={16} />
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}

            {/* Demo preset buttons */}
            <div className="text-xs text-gray-500">نمونه ورود برای تست:</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmail("client@navalhub.ir");
                  setPassword("client123");
                }}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white/80 hover:bg-gray-100 transition text-center"
              >
                مشتری
                <br />
                client@navalhub.ir
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("tech@navalhub.ir");
                  setPassword("tech123");
                }}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white/80 hover:bg-gray-100 transition text-center"
              >
                تکنسین
                <br />
                tech@navalhub.ir
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("admin@navalhub.ir");
                  setPassword("admin123");
                }}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white/80 hover:bg-gray-100 transition text-center"
              >
                مدیر
                <br />
                admin@navalhub.ir
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              disabled={submitting}
            >
              {submitting ? "در حال ورود…" : "ورود"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
