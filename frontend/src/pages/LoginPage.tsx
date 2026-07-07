import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login, register } from "../services/api";
import { BookOpen } from "lucide-react";

const INPUT_CLS = "w-full text-sm font-medium px-4 py-2.5 transition-all focus:outline-none";
const INPUT_STYLE = {
  background: "#F8FAFC",
  border: "1px solid rgba(55,67,117,.12)",
  borderRadius: "14px",
  color: "#374375",
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">(
    searchParams.get("mode") === "register" ? "register" : "login"
  );
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = mode === "login"
        ? await login(email, password)
        : await register(email, password, name);
      setToken(res.data.access_token);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Something went wrong — is the backend running?";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  function focusInput(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "#374375";
    e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(55,67,117,.12)";
  }
  function blurInput(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "rgba(55,67,117,.12)";
    e.currentTarget.style.boxShadow   = "none";
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: "#FFFCF5",
        backgroundImage: "radial-gradient(rgba(55,67,117,.06) 1.5px, transparent 1.5px)",
        backgroundSize: "28px 28px",
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Link to="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
            <BookOpen size={28} style={{ color: "#BABDE2" }} />
            <span className="font-['Yeseva_One'] text-4xl font-bold" style={{ color: "#374375" }}>
              Notely
            </span>
          </Link>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "28px",
            border: "1px solid rgba(55,67,117,.08)",
            boxShadow: "0 12px 40px rgba(55,67,117,.10)",
            padding: "32px",
          }}
        >
          <h1 className="font-['Yeseva_One'] text-3xl font-bold mb-6" style={{ color: "#374375" }}>
            {mode === "login" ? "Welcome back!" : "Create account"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "rgba(55,67,117,.55)" }}>Name</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name" required
                  className={INPUT_CLS} style={INPUT_STYLE}
                  onFocus={focusInput} onBlur={blurInput}
                />
              </div>
            )}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "rgba(55,67,117,.55)" }}>Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className={INPUT_CLS} style={INPUT_STYLE}
                onFocus={focusInput} onBlur={blurInput}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "rgba(55,67,117,.55)" }}>Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required
                className={INPUT_CLS} style={INPUT_STYLE}
                onFocus={focusInput} onBlur={blurInput}
              />
            </div>

            {error && (
              <div
                className="text-sm font-medium px-4 py-3"
                style={{
                  backgroundColor: "rgba(137,81,89,.08)",
                  border: "1px solid rgba(137,81,89,.20)",
                  borderRadius: "14px",
                  color: "#895159",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-3 text-white transition-all mt-2 disabled:opacity-50"
              style={{
                background: "#374375",
                borderRadius: "14px",
                boxShadow: "0 4px 14px rgba(55,67,117,.20)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#2A3562"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#374375"; }}
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm mt-6 font-medium" style={{ color: "rgba(55,67,117,.55)" }}>
            {mode === "login" ? "No account?" : "Already have one?"}{" "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="font-bold transition-colors"
              style={{ color: "#895159" }}
            >
              {mode === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "rgba(55,67,117,.50)" }}>
          Free forever · No credit card needed
        </p>
      </div>
    </div>
  );
}
