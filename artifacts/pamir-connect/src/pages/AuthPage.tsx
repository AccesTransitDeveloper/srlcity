import { useState, useRef, useEffect } from "react";
import { Loader2, Mountain, Phone, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

type AuthMethod = "phone" | "email";
type PhoneStep = "enterPhone" | "enterCode";
type EmailMode = "login" | "register";

const COUNTRY_CODES = [
  { code: "+7", flag: "🇷🇺", name: "Россия" },
  { code: "+992", flag: "🇹🇯", name: "Таджикистан" },
  { code: "+996", flag: "🇰🇬", name: "Кыргызстан" },
  { code: "+7", flag: "🇰🇿", name: "Казахстан" },
  { code: "+380", flag: "🇺🇦", name: "Украина" },
  { code: "+49", flag: "🇩🇪", name: "Германия" },
];

const PhoneLogin = () => {
  const { signInWithPhone } = useAuth();
  const [step, setStep] = useState<PhoneStep>("enterPhone");
  const [countryCode, setCountryCode] = useState("+7");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullPhone, setFullPhone] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [demoCode, setDemoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) { setError("Введите номер телефона"); return; }
    const full = countryCode + phoneNumber.replace(/\D/g, "");
    setLoading(true);
    setError("");
    try {
      const res = await api.auth.phoneRequest(full);
      setFullPhone(full);
      setIsNew(res.isNew);
      setDemoCode(res.code);
      setStep("enterCode");
    } catch (err: any) {
      setError(err.message || "Ошибка отправки кода");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeInput = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newCode = [...code];
    newCode[idx] = val.slice(-1);
    setCode(newCode);
    setError("");
    if (val && idx < 5) codeRefs.current[idx + 1]?.focus();
    if (newCode.every(c => c !== "") && !val.includes(" ")) {
      verifyCode(newCode.join(""));
    }
  };

  const handleCodeKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  };

  const verifyCode = async (codeStr: string) => {
    if (isNew && !name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.auth.phoneVerify({ phone: fullPhone, code: codeStr, name: name.trim() || undefined });
      signInWithPhone(res.token, res.user);
    } catch (err: any) {
      setError(err.message || "Неверный код");
      setCode(["", "", "", "", "", ""]);
      codeRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeStr = code.join("");
    if (codeStr.length < 6) { setError("Введите 6-значный код"); return; }
    await verifyCode(codeStr);
  };

  useEffect(() => {
    if (step === "enterCode") {
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  if (step === "enterPhone") {
    return (
      <form onSubmit={handleRequestCode} className="space-y-4">
        <div className="text-center py-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
            <Phone className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Введите ваш номер телефона. Мы отправим вам код подтверждения.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Номер телефона</label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={e => setCountryCode(e.target.value)}
              className="rounded-lg border border-border bg-background px-2 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary flex-shrink-0"
            >
              {COUNTRY_CODES.map(c => (
                <option key={c.code + c.name} value={c.code}>{c.flag} {c.code}</option>
              ))}
            </select>
            <input
              type="tel"
              value={phoneNumber}
              onChange={e => { setPhoneNumber(e.target.value); setError(""); }}
              placeholder="999 123 45 67"
              autoComplete="tel"
              inputMode="tel"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 font-display font-semibold text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Отправляю...</> : "Получить код"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifySubmit} className="space-y-4">
      <button
        type="button"
        onClick={() => { setStep("enterPhone"); setCode(["", "", "", "", "", ""]); setError(""); }}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Изменить номер
      </button>

      <div className="text-center py-1">
        <p className="text-sm font-medium text-foreground">{fullPhone}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Введите код подтверждения</p>
      </div>

      {demoCode && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800">Ваш код подтверждения:</p>
            <p className="text-2xl font-mono font-bold text-amber-700 tracking-widest">{demoCode}</p>
          </div>
        </div>
      )}

      {isNew && (
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Ваше имя *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Как вас зовут?"
            autoComplete="name"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-2">Код из 6 цифр</label>
        <div className="flex gap-2 justify-center">
          {code.map((digit, idx) => (
            <input
              key={idx}
              ref={el => { codeRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleCodeInput(idx, e.target.value)}
              onKeyDown={e => handleCodeKeyDown(idx, e)}
              className="h-12 w-10 rounded-lg border border-border bg-background text-center text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          ))}
        </div>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium">{error}</div>}

      <button
        type="submit"
        disabled={loading || code.some(c => !c) || (isNew && !name.trim())}
        className="w-full rounded-xl bg-primary py-3 font-display font-semibold text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Вход...</> : "Подтвердить"}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Не получили код?{" "}
        <button type="button" onClick={() => handleRequestCode({ preventDefault: () => {} } as any)} className="text-primary font-medium">
          Отправить снова
        </button>
      </p>
    </form>
  );
};

const EmailLogin = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<EmailMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "", name: "", city: "", bio: "" });

  const update = (field: string, value: string) => { setForm(f => ({ ...f, [field]: value })); setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError("Введите email и пароль"); return; }
    if (mode === "register" && !form.name) { setError("Введите ваше имя"); return; }
    if (mode === "register" && form.password.length < 6) { setError("Пароль минимум 6 символов"); return; }
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        await signIn(form.email.trim(), form.password);
      } else {
        await signUp({ email: form.email.trim(), password: form.password, name: form.name.trim(), city: form.city.trim() || undefined, bio: form.bio.trim() || undefined });
      }
    } catch (err: any) {
      setError(err.message || "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex rounded-xl bg-secondary p-1 mb-2">
        <button onClick={() => { setMode("login"); setError(""); }} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${mode === "login" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>Войти</button>
        <button onClick={() => { setMode("register"); setError(""); }} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${mode === "register" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>Регистрация</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "register" && (
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Полное имя *</label>
            <input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Ваше имя" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Email *</label>
          <input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="email@example.com" autoComplete="email" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Пароль *</label>
          <input type="password" value={form.password} onChange={e => update("password", e.target.value)} placeholder={mode === "register" ? "Минимум 6 символов" : "••••••••"} autoComplete={mode === "login" ? "current-password" : "new-password"} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        {mode === "register" && (
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Город</label>
            <input value={form.city} onChange={e => update("city", e.target.value)} placeholder="Ваш город" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        )}
        {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium">{error}</div>}
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary py-3 font-display font-semibold text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" />{mode === "login" ? "Вход..." : "Создание..."}</> : (mode === "login" ? "Войти" : "Создать аккаунт")}
        </button>
      </form>
    </div>
  );
};

const AuthPage = () => {
  const [method, setMethod] = useState<AuthMethod>("phone");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Mountain className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">SaryKol City</h1>
          <p className="text-sm text-muted-foreground mt-1">Социальная сеть для всех</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex rounded-xl bg-secondary p-1 mb-5">
            <button
              onClick={() => setMethod("phone")}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${method === "phone" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              <Phone className="h-4 w-4" /> Телефон
            </button>
            <button
              onClick={() => setMethod("email")}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${method === "email" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              <Mail className="h-4 w-4" /> Email
            </button>
          </div>

          {method === "phone" ? <PhoneLogin /> : <EmailLogin />}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          SaryKol City · Объединяем людей
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
