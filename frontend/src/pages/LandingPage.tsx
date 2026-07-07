import { useNavigate } from "react-router-dom";
import { BookOpen, Mic, Sparkles, Link, ArrowRight, CheckCircle } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-[#374375]" style={{
      backgroundColor: "#FFFCF5",
      backgroundImage: "radial-gradient(rgba(55,67,117,.06) 1.5px, transparent 1.5px)",
      backgroundSize: "28px 28px",
    }}>
      {/* Nav */}
      <nav
        className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto"
        style={{ borderBottom: "1px solid rgba(55,67,117,.08)" }}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={22} style={{ color: "#BABDE2" }} />
          <span className="font-['Yeseva_One'] text-2xl font-bold tracking-wide" style={{ color: "#374375" }}>
            Notely
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-semibold px-4 py-2 transition-colors"
            style={{ color: "rgba(55,67,117,.55)" }}
          >
            Sign in
          </button>
          <button
            onClick={() => navigate("/login?mode=register")}
            className="text-sm font-bold px-5 py-2 rounded-full text-white transition-all shadow-sm"
            style={{ backgroundColor: "#374375" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2A3562"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#374375"; }}
          >
            Get started free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-8"
          style={{
            backgroundColor: "rgba(55,67,117,.08)",
            border: "1px solid rgba(186,189,226,.30)",
            color: "#374375",
          }}
        >
          ✨ For tutors, coaches, freelancers & anyone who talks
        </div>

        <h1 className="font-['Yeseva_One'] text-6xl sm:text-7xl font-bold leading-tight mb-6" style={{ color: "#374375" }}>
          Session notes that<br />
          <span style={{ color: "#895159" }}>write themselves</span>
        </h1>

        <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium" style={{ color: "rgba(55,67,117,.55)" }}>
          Record a conversation, let AI split it by speaker, generate a structured summary, and sync it straight to Notion.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/login?mode=register")}
            className="flex items-center justify-center gap-2 font-bold text-base px-8 py-3.5 rounded-full text-white transition-all shadow-md"
            style={{ backgroundColor: "#374375" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2A3562"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#374375"; }}
          >
            Start for free <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center justify-center gap-2 font-semibold text-base px-8 py-3.5 rounded-full transition-all"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(55,67,117,.12)",
              color: "#374375",
              boxShadow: "0 4px 16px rgba(55,67,117,.07)",
            }}
          >
            Sign in
          </button>
        </div>
      </section>

      {/* App preview */}
      <section className="max-w-2xl mx-auto px-6 pb-24">
        <div
          className="overflow-hidden"
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            border: "1px solid rgba(55,67,117,.08)",
            boxShadow: "0 16px 56px rgba(55,67,117,.10)",
          }}
        >
          {/* Fake titlebar */}
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(55,67,117,.06)", backgroundColor: "#374375" }}
          >
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#895159" }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#BABDE2" }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#E1AEA1" }} />
            </div>
            <span className="font-['Yeseva_One'] text-base text-white/70">Riya — Maths Session</span>
            <div className="w-16" />
          </div>

          <div className="p-5 space-y-3" style={{ backgroundColor: "#F8FAFC" }}>
            <div className="flex justify-end">
              <div
                className="px-4 py-3 max-w-[78%]"
                style={{
                  background: "rgba(55,67,117,.06)",
                  borderRadius: "16px 16px 4px 16px",
                  border: "1px solid rgba(55,67,117,.08)",
                }}
              >
                <p className="text-sm" style={{ color: "#374375" }}>🎤 "Riya is struggling with factoring quadratics — covered FOIL but needs more practice"</p>
                <p className="text-xs mt-1" style={{ color: "rgba(55,67,117,.55)" }}>12:04 PM</p>
              </div>
            </div>
            <div className="flex justify-end">
              <div
                className="px-4 py-3 max-w-[78%]"
                style={{
                  background: "rgba(55,67,117,.06)",
                  borderRadius: "16px 16px 4px 16px",
                  border: "1px solid rgba(55,67,117,.08)",
                }}
              >
                <p className="text-sm" style={{ color: "#374375" }}>✏️ Covered chapters 4 and 5. Assigned Ex 4.3 for homework.</p>
                <p className="text-xs mt-1" style={{ color: "rgba(55,67,117,.55)" }}>12:18 PM</p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="flex gap-2 items-start max-w-[78%]">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-sm"
                  style={{ backgroundColor: "rgba(186,189,226,.20)", border: "1px solid rgba(186,189,226,.35)" }}
                >
                  🤖
                </div>
                <div
                  className="px-4 py-3"
                  style={{
                    background: "rgba(186,189,226,.12)",
                    borderRadius: "16px 16px 16px 4px",
                    border: "1px solid rgba(186,189,226,.25)",
                  }}
                >
                  <p className="text-sm" style={{ color: "#374375" }}>Consider introducing the discriminant formula next — it follows directly from her factoring gaps.</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(55,67,117,.55)" }}>12:19 PM</p>
                </div>
              </div>
            </div>
          </div>

          <div
            className="px-5 py-3 flex items-center gap-3"
            style={{ borderTop: "1px solid rgba(55,67,117,.06)", backgroundColor: "#ffffff" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(55,67,117,.10)" }}
            >
              <Mic size={16} style={{ color: "#BABDE2" }} />
            </div>
            <div
              className="flex-1 px-4 py-2.5 text-sm"
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid rgba(55,67,117,.08)",
                borderRadius: "12px",
                color: "rgba(55,67,117,.55)",
              }}
            >
              Type a note…
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(55,67,117,.08)" }}
            >
              <Sparkles size={15} style={{ color: "#BABDE2" }} />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-white" style={{ borderTop: "1px solid rgba(55,67,117,.06)" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="font-['Yeseva_One'] text-5xl font-bold text-center mb-4" style={{ color: "#374375" }}>
            Everything you need
          </h2>
          <p className="text-center mb-16 max-w-xl mx-auto font-medium" style={{ color: "rgba(55,67,117,.55)" }}>
            Designed around how conversations actually work — fast, focused, and distraction-free.
          </p>
          <div className="grid sm:grid-cols-3 gap-5">
            <FeatureCard
              icon={<Mic size={22} />} accent="#BABDE2"
              title="Voice recording"
              description="Record short clips or full conversations. Groq Whisper transcribes everything instantly — no local install needed."
            />
            <FeatureCard
              icon={<Sparkles size={22} />} accent="#374375"
              title="Speaker diarization"
              description="LLaMA 3.3 70B reads the transcript and identifies who said what — tutor vs student, coach vs client."
            />
            <FeatureCard
              icon={<Link size={22} />} accent="#895159"
              title="Notion sync"
              description="Connect once, sync forever. Structured summaries land in your Notion database with one tap."
            />
          </div>
        </div>
      </section>

      {/* Checklist */}
      <section className="py-20 px-6" style={{ backgroundColor: "#FFFCF5" }}>
        <div className="max-w-xl mx-auto">
          <h2 className="font-['Yeseva_One'] text-4xl font-bold text-center mb-10" style={{ color: "#374375" }}>
            Built for real sessions
          </h2>
          <div className="space-y-4">
            {[
              "Notes auto-saved — no data loss if the browser closes",
              "AI suggestions triggered on-demand, not every keystroke",
              "Speaker labels use your actual participant names",
              "Ask the AI questions about any conversation chunk",
              "Works on mobile browsers during in-person sessions",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: "#BABDE2" }} />
                <span className="text-sm leading-relaxed font-medium" style={{ color: "#374375" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center bg-white" style={{ borderTop: "1px solid rgba(55,67,117,.06)" }}>
        <div className="max-w-lg mx-auto">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-6 text-3xl"
            style={{ backgroundColor: "rgba(55,67,117,.10)", border: "1px solid rgba(186,189,226,.25)" }}
          >
            📓
          </div>
          <h2 className="font-['Yeseva_One'] text-5xl font-bold mb-4" style={{ color: "#374375" }}>
            Free to use, yours to own
          </h2>
          <p className="mb-8 font-medium" style={{ color: "rgba(55,67,117,.55)" }}>
            No subscriptions. AI features use Groq's free tier. Your notes stay on your machine.
          </p>
          <button
            onClick={() => navigate("/login?mode=register")}
            className="inline-flex items-center gap-2 font-bold text-base px-8 py-4 rounded-full text-white transition-all shadow-md"
            style={{ backgroundColor: "#374375" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2A3562"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#374375"; }}
          >
            Create your account <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6" style={{ borderTop: "1px solid rgba(55,67,117,.06)", backgroundColor: "#FFFCF5" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ color: "rgba(55,67,117,.50)" }}>
            <BookOpen size={16} />
            <span className="font-['Yeseva_One'] text-lg font-semibold">Notely</span>
          </div>
          <p className="text-xs" style={{ color: "rgba(55,67,117,.50)" }}>
            Real-time notes for anyone who has conversations that matter
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, accent, title, description }: {
  icon: React.ReactNode; accent: string; title: string; description: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "24px",
        border: "1px solid rgba(55,67,117,.06)",
        boxShadow: "0 12px 40px rgba(55,67,117,.07)",
        padding: "24px",
      }}
    >
      <div className="mb-4" style={{ color: accent }}>{icon}</div>
      <h3 className="font-['Yeseva_One'] text-xl font-bold mb-2" style={{ color: "#374375" }}>{title}</h3>
      <p className="text-sm leading-relaxed font-medium" style={{ color: "rgba(55,67,117,.55)" }}>{description}</p>
    </div>
  );
}
