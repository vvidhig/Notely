import type { SessionType } from "../types";

export interface SessionTypeConfig {
  value: SessionType;
  label: string;
  emoji: string;
  description: string;
  summaryLabel: string;
}

export const SESSION_TYPES: SessionTypeConfig[] = [
  { value: "tutoring",    label: "Tutoring",     emoji: "📚", description: "Student + tutor academic session",       summaryLabel: "Tutoring Summary" },
  { value: "coaching",    label: "Coaching",     emoji: "🏋️", description: "Fitness, life, or career coaching",       summaryLabel: "Coaching Summary" },
  { value: "client_call", label: "Client Call",  emoji: "💼", description: "Freelancer or agency client discussion",  summaryLabel: "Call Summary" },
  { value: "meeting",     label: "Meeting",      emoji: "🗓️", description: "Team or 1-on-1 meeting",                  summaryLabel: "Meeting Summary" },
  { value: "interview",   label: "Interview",    emoji: "🎙️", description: "Job interview or podcast interview",      summaryLabel: "Interview Summary" },
  { value: "custom",      label: "Custom",       emoji: "⚡", description: "Anything else — generic defaults",        summaryLabel: "Session Summary" },
];

export const SUMMARY_SECTIONS: Record<SessionType, { key: string; label: string; emoji: string }[]> = {
  tutoring: [
    { key: "topics_covered",  label: "Topics Covered",   emoji: "📚" },
    { key: "understood",      label: "Understood",        emoji: "✅" },
    { key: "struggled_with",  label: "Struggled With",    emoji: "⚠️" },
    { key: "homework",        label: "Homework",          emoji: "📝" },
    { key: "next_session",    label: "Next Session",      emoji: "➡️" },
  ],
  coaching: [
    { key: "goals_discussed", label: "Goals Discussed",   emoji: "🎯" },
    { key: "progress",        label: "Progress",          emoji: "📈" },
    { key: "blockers",        label: "Blockers",          emoji: "🚧" },
    { key: "action_items",    label: "Action Items",      emoji: "✅" },
    { key: "next_session",    label: "Next Session",      emoji: "➡️" },
  ],
  client_call: [
    { key: "requirements",    label: "Requirements",      emoji: "📋" },
    { key: "decisions",       label: "Decisions",         emoji: "⚖️" },
    { key: "open_questions",  label: "Open Questions",    emoji: "❓" },
    { key: "deliverables",    label: "Deliverables",      emoji: "📦" },
    { key: "timeline",        label: "Timeline",          emoji: "🗓️" },
  ],
  meeting: [
    { key: "agenda_covered",  label: "Agenda Covered",    emoji: "📋" },
    { key: "decisions_made",  label: "Decisions Made",    emoji: "⚖️" },
    { key: "action_items",    label: "Action Items",      emoji: "✅" },
    { key: "owners",          label: "Owners",            emoji: "👤" },
    { key: "follow_ups",      label: "Follow-ups",        emoji: "🔄" },
  ],
  interview: [
    { key: "questions_asked", label: "Questions Asked",   emoji: "❓" },
    { key: "key_answers",     label: "Key Answers",       emoji: "💬" },
    { key: "strengths",       label: "Strengths",         emoji: "✅" },
    { key: "concerns",        label: "Concerns",          emoji: "⚠️" },
    { key: "next_steps",      label: "Next Steps",        emoji: "➡️" },
  ],
  custom: [
    { key: "key_points",      label: "Key Points",        emoji: "📌" },
    { key: "decisions",       label: "Decisions",         emoji: "⚖️" },
    { key: "action_items",    label: "Action Items",      emoji: "✅" },
    { key: "follow_ups",      label: "Follow-ups",        emoji: "🔄" },
  ],
};
