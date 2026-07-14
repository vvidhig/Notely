import type { SessionType } from "../types";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen, Dumbbell, Briefcase, CalendarDays, Mic, Zap,
  CheckCircle2, AlertTriangle, FileText, ArrowRight, Target,
  TrendingUp, Construction, ClipboardList, Scale, HelpCircle,
  Package, User, RefreshCw, MessageCircle, Pin,
} from "lucide-react";

export interface SessionTypeConfig {
  value: SessionType;
  label: string;
  icon: LucideIcon;
  description: string;
  summaryLabel: string;
}

export const SESSION_TYPES: SessionTypeConfig[] = [
  { value: "tutoring",    label: "Tutoring",     icon: BookOpen,     description: "Student + tutor academic session",       summaryLabel: "Tutoring Summary" },
  { value: "coaching",    label: "Coaching",     icon: Dumbbell,     description: "Fitness, life, or career coaching",       summaryLabel: "Coaching Summary" },
  { value: "client_call", label: "Client Call",  icon: Briefcase,    description: "Freelancer or agency client discussion",  summaryLabel: "Call Summary" },
  { value: "meeting",     label: "Meeting",      icon: CalendarDays, description: "Team or 1-on-1 meeting",                  summaryLabel: "Meeting Summary" },
  { value: "interview",   label: "Interview",    icon: Mic,          description: "Job interview or podcast interview",      summaryLabel: "Interview Summary" },
  { value: "custom",      label: "Custom",       icon: Zap,          description: "Anything else — generic defaults",        summaryLabel: "Session Summary" },
];

export const SUMMARY_SECTIONS: Record<SessionType, { key: string; label: string; icon: LucideIcon }[]> = {
  tutoring: [
    { key: "topics_covered",  label: "Topics Covered",   icon: BookOpen },
    { key: "understood",      label: "Understood",        icon: CheckCircle2 },
    { key: "struggled_with",  label: "Struggled With",    icon: AlertTriangle },
    { key: "homework",        label: "Homework",          icon: FileText },
    { key: "next_session",    label: "Next Session",      icon: ArrowRight },
  ],
  coaching: [
    { key: "goals_discussed", label: "Goals Discussed",   icon: Target },
    { key: "progress",        label: "Progress",          icon: TrendingUp },
    { key: "blockers",        label: "Blockers",          icon: Construction },
    { key: "action_items",    label: "Action Items",      icon: CheckCircle2 },
    { key: "next_session",    label: "Next Session",      icon: ArrowRight },
  ],
  client_call: [
    { key: "requirements",    label: "Requirements",      icon: ClipboardList },
    { key: "decisions",       label: "Decisions",         icon: Scale },
    { key: "open_questions",  label: "Open Questions",    icon: HelpCircle },
    { key: "deliverables",    label: "Deliverables",      icon: Package },
    { key: "timeline",        label: "Timeline",          icon: CalendarDays },
  ],
  meeting: [
    { key: "agenda_covered",  label: "Agenda Covered",    icon: ClipboardList },
    { key: "decisions_made",  label: "Decisions Made",    icon: Scale },
    { key: "action_items",    label: "Action Items",      icon: CheckCircle2 },
    { key: "owners",          label: "Owners",            icon: User },
    { key: "follow_ups",      label: "Follow-ups",        icon: RefreshCw },
  ],
  interview: [
    { key: "questions_asked", label: "Questions Asked",   icon: HelpCircle },
    { key: "key_answers",     label: "Key Answers",       icon: MessageCircle },
    { key: "strengths",       label: "Strengths",         icon: CheckCircle2 },
    { key: "concerns",        label: "Concerns",          icon: AlertTriangle },
    { key: "next_steps",      label: "Next Steps",        icon: ArrowRight },
  ],
  custom: [
    { key: "key_points",      label: "Key Points",        icon: Pin },
    { key: "decisions",       label: "Decisions",         icon: Scale },
    { key: "action_items",    label: "Action Items",      icon: CheckCircle2 },
    { key: "follow_ups",      label: "Follow-ups",        icon: RefreshCw },
  ],
};
