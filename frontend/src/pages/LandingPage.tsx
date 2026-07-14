import { useNavigate } from "react-router-dom";
import { BookOpen, Mic, Sparkles, ArrowRight, CheckCircle, Bot, NotebookPen, CheckSquare } from "lucide-react";

/* ── dot-grid backgrounds ─────────────────────────────────────────────── */
const darkDots = {
  backgroundColor: "#111111",
  backgroundImage: "radial-gradient(rgba(255,255,255,.10) 1.5px, transparent 1.5px)",
  backgroundSize: "26px 26px",
};
const lightDots = {
  backgroundColor: "#FFFFFF",
  backgroundImage: "radial-gradient(rgba(17,17,17,.08) 1.5px, transparent 1.5px)",
  backgroundSize: "26px 26px",
};

/* ── decorative SVG graphics ──────────────────────────────────────────── */

function WaveformArt({ light }: { light?: boolean }) {
  const bars = [6, 14, 22, 10, 30, 18, 26, 12, 34, 20, 8, 24, 16, 30, 10, 22, 6, 18, 26, 12, 32, 16, 8, 20];
  const fill = light ? "rgba(255,255,255,.55)" : "rgba(17,17,17,.75)";
  return (
    <svg width="240" height="40" viewBox="0 0 240 40" className="mx-auto" aria-hidden="true">
      {bars.map((h, i) => (
        <rect key={i} x={i * 10} y={(40 - h) / 2} width="4" height={h} rx="2" fill={fill} />
      ))}
    </svg>
  );
}

function ProductivityArt() {
  // mic + waveform + summary sheet + checklist, black line art on white
  return (
    <svg width="420" height="220" viewBox="0 0 420 220" className="mx-auto" aria-hidden="true">
      {/* microphone */}
      <rect x="52" y="30" width="44" height="76" rx="22" fill="none" stroke="#111111" strokeWidth="5" />
      <path d="M36 84 a38 38 0 0 0 76 0" fill="none" stroke="#111111" strokeWidth="5" strokeLinecap="round" />
      <line x1="74" y1="122" x2="74" y2="150" stroke="#111111" strokeWidth="5" strokeLinecap="round" />
      <line x1="52" y1="150" x2="96" y2="150" stroke="#111111" strokeWidth="5" strokeLinecap="round" />
      {/* waveform between mic and sheet */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const hs = [10, 22, 34, 16, 28, 12, 20];
        return (
          <rect key={i} x={128 + i * 12} y={90 - hs[i] / 2} width="5" height={hs[i]} rx="2.5" fill="#111111" />
        );
      })}
      {/* arrow */}
      <line x1="218" y1="90" x2="244" y2="90" stroke="#111111" strokeWidth="5" strokeLinecap="round" />
      <path d="M238 80 L250 90 L238 100" fill="none" stroke="#111111" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {/* summary / checklist sheet */}
      <rect x="268" y="28" width="120" height="150" rx="14" fill="none" stroke="#111111" strokeWidth="5" />
      <line x1="286" y1="56" x2="356" y2="56" stroke="#111111" strokeWidth="5" strokeLinecap="round" />
      {/* checklist rows */}
      {[86, 114, 142].map((y, i) => (
        <g key={i}>
          <rect x="284" y={y - 8} width="16" height="16" rx="4" fill="none" stroke="#111111" strokeWidth="4" />
          {i < 2 && <path d={`M287 ${y} l4 5 l7 -9`} fill="none" stroke="#111111" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
          <line x1="312" y1={y} x2="366" y2={y} stroke="#111111" strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}
      {/* floating accents */}
      <circle cx="30" cy="190" r="5" fill="#111111" />
      <circle cx="210" cy="196" r="4" fill="#111111" />
      <circle cx="404" cy="188" r="5" fill="#111111" />
    </svg>
  );
}

/* ── page ─────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>

      {/* ══ SECTION 1 — BLACK: nav + hero + app preview ══ */}
      <div style={darkDots}>
        {/* Nav */}
        <nav
          className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto"
          style={{ borderBottom: "1px solid rgba(255,255,255,.12)" }}
        >
          <div className="flex items-center gap-2">
            <BookOpen size={22} style={{ color: "#FFFFFF" }} />
            <span className="font-['Yeseva_One'] text-4xl font-bold tracking-wide text-white">
              Notely
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="text-lg font-semibold px-4 py-2 transition-colors"
              style={{ color: "rgba(255,255,255,.65)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,.65)"; }}
            >
              Sign in
            </button>
            <button
              onClick={() => navigate("/login?mode=register")}
              className="text-lg font-bold px-5 py-2 rounded-full transition-all shadow-sm"
              style={{ backgroundColor: "#FFFFFF", color: "#111111" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#EEEEEE"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FFFFFF"; }}
            >
              Get started free
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
          <div
            className="inline-flex items-center gap-2 text-base font-semibold px-4 py-1.5 rounded-full mb-8"
            style={{
              backgroundColor: "rgba(255,255,255,.10)",
              border: "1px solid rgba(255,255,255,.25)",
              color: "#FFFFFF",
            }}
          >
            <Sparkles size={14} /> Your all-in-one productivity workspace
          </div>

          <h1 className="font-['Yeseva_One'] text-6xl sm:text-7xl font-bold leading-tight mb-6 text-white">
            Record meetings.<br />
            <span style={{ color: "rgba(255,255,255,.70)" }}>Get things done.</span>
          </h1>

          <p className="text-2xl max-w-2xl mx-auto mb-8 leading-relaxed font-medium" style={{ color: "rgba(255,255,255,.65)" }}>
            Record a meeting, let AI split it by speaker and generate a structured
            summary, then turn the moments that matter into tasks you can track.
          </p>

          <WaveformArt light />

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <button
              onClick={() => navigate("/login?mode=register")}
              className="flex items-center justify-center gap-2 font-bold text-xl px-8 py-3.5 rounded-full transition-all shadow-md"
              style={{ backgroundColor: "#FFFFFF", color: "#111111" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#EEEEEE"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FFFFFF"; }}
            >
              Start for free <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="flex items-center justify-center gap-2 font-semibold text-xl px-8 py-3.5 rounded-full transition-all text-white"
              style={{ backgroundColor: "transparent", border: "1px solid rgba(255,255,255,.35)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,.10)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
            >
              Sign in
            </button>
          </div>
        </section>

        {/* App preview — white card pops on black */}
        <section className="max-w-2xl mx-auto px-6 pb-24">
          <div
            className="overflow-hidden"
            style={{
              background: "#FFFFFF",
              borderRadius: "24px",
              border: "1px solid rgba(255,255,255,.20)",
              boxShadow: "0 16px 56px rgba(0,0,0,.45)",
            }}
          >
            {/* Fake titlebar */}
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ backgroundColor: "#111111" }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FFFFFF" }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(255,255,255,.55)" }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(255,255,255,.25)" }} />
              </div>
              <span className="font-['Yeseva_One'] text-xl text-white/70">Weekly Team Sync</span>
              <div className="w-16" />
            </div>

            <div className="p-5 space-y-3" style={{ backgroundColor: "#F8FAFC" }}>
              <div className="flex justify-end">
                <div
                  className="px-4 py-3 max-w-[78%]"
                  style={{
                    background: "rgba(17,17,17,.06)",
                    borderRadius: "16px 16px 4px 16px",
                    border: "1px solid rgba(17,17,17,.08)",
                  }}
                >
                  <p className="text-lg" style={{ color: "#111111" }}>"Launch slipped to Friday — design review still open, QA starts Wednesday"</p>
                  <p className="text-base mt-1" style={{ color: "rgba(17,17,17,.55)" }}>12:04 PM</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div
                  className="px-4 py-3 max-w-[78%]"
                  style={{
                    background: "rgba(17,17,17,.06)",
                    borderRadius: "16px 16px 4px 16px",
                    border: "1px solid rgba(17,17,17,.08)",
                  }}
                >
                  <p className="text-lg" style={{ color: "#111111" }}>Assigned the API cleanup to Sam. Demo scheduled for Monday.</p>
                  <p className="text-base mt-1" style={{ color: "rgba(17,17,17,.55)" }}>12:18 PM</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="flex gap-2 items-start max-w-[78%]">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "rgba(17,17,17,.08)", border: "1px solid rgba(17,17,17,.15)", color: "#111111" }}
                  >
                    <Bot size={15} />
                  </div>
                  <div
                    className="px-4 py-3"
                    style={{
                      background: "rgba(17,17,17,.04)",
                      borderRadius: "16px 16px 16px 4px",
                      border: "1px solid rgba(17,17,17,.10)",
                    }}
                  >
                    <p className="text-lg" style={{ color: "#111111" }}>Summary: launch moved to Friday. Action items — close design review, Sam owns API cleanup, demo Monday.</p>
                    <p className="text-base mt-1" style={{ color: "rgba(17,17,17,.55)" }}>12:19 PM</p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="px-5 py-3 flex items-center gap-3"
              style={{ borderTop: "1px solid rgba(17,17,17,.06)", backgroundColor: "#FFFFFF" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#111111" }}
              >
                <Mic size={16} style={{ color: "#FFFFFF" }} />
              </div>
              <div
                className="flex-1 px-4 py-2.5 text-lg"
                style={{
                  backgroundColor: "#F8FAFC",
                  border: "1px solid rgba(17,17,17,.08)",
                  borderRadius: "12px",
                  color: "rgba(17,17,17,.55)",
                }}
              >
                Type a note…
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(17,17,17,.08)" }}
              >
                <Sparkles size={15} style={{ color: "#111111" }} />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ══ SECTION 2 — WHITE: features ══ */}
      <section className="py-24 px-6" style={lightDots}>
        <div className="max-w-4xl mx-auto">
          <h2 className="font-['Yeseva_One'] text-5xl font-bold text-center mb-4" style={{ color: "#111111" }}>
            Everything you need
          </h2>
          <p className="text-center mb-16 max-w-xl mx-auto font-medium text-lg" style={{ color: "rgba(17,17,17,.55)" }}>
            Record the conversation, get the summary, track the work — without leaving one workspace.
          </p>
          <div className="grid sm:grid-cols-3 gap-5">
            <FeatureCard
              icon={<Mic size={22} />}
              title="Meeting recording"
              description="Record short clips or full meetings. Everything is transcribed instantly — no local install needed."
            />
            <FeatureCard
              icon={<Sparkles size={22} />}
              title="AI summaries"
              description="AI reads the transcript, identifies who said what, and ends every meeting with a structured summary: decisions, action items, next steps."
            />
            <FeatureCard
              icon={<CheckSquare size={22} />}
              title="Task tracking"
              description="Turn key moments into tasks in one tap. Prioritize them on a board, set due dates, and check them off as you go."
            />
          </div>
        </div>
      </section>

      {/* ══ SECTION 3 — BLACK: checklist ══ */}
      <section className="py-20 px-6" style={darkDots}>
        <div className="max-w-xl mx-auto">
          <h2 className="font-['Yeseva_One'] text-4xl font-bold text-center mb-10 text-white">
            Built for real workdays
          </h2>
          <div className="space-y-4">
            {[
              "Record meetings and calls — transcribed as you speak",
              "AI splits the transcript by speaker automatically",
              "Structured summaries the moment a meeting ends",
              "Highlight key moments and turn them into tasks",
              "Track everything on a board with due dates and priorities",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle size={18} className="flex-shrink-0 mt-1" style={{ color: "#FFFFFF" }} />
                <span className="text-lg leading-relaxed font-medium text-white">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <WaveformArt light />
          </div>
        </div>
      </section>

      {/* ══ SECTION 4 — WHITE: CTA ══ */}
      <section className="py-24 px-6 text-center" style={lightDots}>
        <div className="max-w-2xl mx-auto">
          <ProductivityArt />
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-6 mt-4"
            style={{ backgroundColor: "#111111", color: "#FFFFFF" }}
          >
            <NotebookPen size={28} />
          </div>
          <h2 className="font-['Yeseva_One'] text-5xl font-bold mb-4" style={{ color: "#111111" }}>
            Free to use, yours to own
          </h2>
          <p className="mb-8 font-medium text-lg" style={{ color: "rgba(17,17,17,.55)" }}>
            No subscriptions. Your meetings, summaries, and tasks stay yours.
          </p>
          <button
            onClick={() => navigate("/login?mode=register")}
            className="inline-flex items-center gap-2 font-bold text-xl px-8 py-4 rounded-full text-white transition-all shadow-md"
            style={{ backgroundColor: "#111111" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#000000"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#111111"; }}
          >
            Create your account <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ══ SECTION 5 — BLACK: footer ══ */}
      <footer className="py-8 px-6" style={darkDots}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <BookOpen size={16} />
            <span className="font-['Yeseva_One'] text-2xl font-semibold">Notely</span>
          </div>
          <p className="text-base" style={{ color: "rgba(255,255,255,.60)" }}>
            Record meetings, generate summaries, track your work — all in one place.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode; title: string; description: string;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "24px",
        border: "1px solid rgba(17,17,17,.12)",
        boxShadow: "0 12px 40px rgba(17,17,17,.08)",
        padding: "24px",
      }}
    >
      <div
        className="mb-4 w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: "#111111", color: "#FFFFFF" }}
      >
        {icon}
      </div>
      <h3 className="font-['Yeseva_One'] text-3xl font-bold mb-2" style={{ color: "#111111" }}>{title}</h3>
      <p className="text-lg leading-relaxed font-medium" style={{ color: "rgba(17,17,17,.55)" }}>{description}</p>
    </div>
  );
}
