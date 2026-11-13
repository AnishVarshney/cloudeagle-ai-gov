export type TimeframeKey = 'Nov 2026 (Current)' | 'Oct 2026' | 'Q4 2026';

export type DepartmentName = 'Engineering' | 'Marketing' | 'Product' | 'Sales';

export type DepartmentFilter = 'All Departments' | DepartmentName;

export type GovernanceStatus = 'Sanctioned' | 'Shadow AI' | 'Underutilized' | 'Blocked';

export type DetectionSource =
  | 'OpenAI Admin API'
  | 'GitHub Metrics API'
  | 'Anthropic Admin API'
  | 'Okta SSO'
  | 'Brex Corporate Card'
  | 'Ramp Expense Feed'
  | 'Google OAuth Log'
  | 'Notion Billing API';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface AIToolItem {
  id: string;
  name: string;
  vendor: string;
  category: string;
  logoText: string;
  logoBg: string;
  logoColor: string;
  status: GovernanceStatus;
  detectionSource: DetectionSource;
  sourceType: 'Admin API' | 'SSO / IdP' | 'Card / Expense' | 'OAuth Grant';
  department: DepartmentName | 'All Teams';
  /** For tools shared across All Teams (e.g., Notion AI), breakdown by department */
  departmentAllocations?: Record<DepartmentName, { spend: number; activeSeats: number; paidSeats: number }>;
  activeSeats: number;
  paidSeats: number;
  monthlySpend: number;
  monthlyCap: number | null; // null means "No Cap"
  projectedEomSpend: number;
  alertThreshold: 80 | 90;
  slackNotify: boolean;
  riskLevel: RiskLevel;
  dataTrainingPolicy: string;
  oauthScopes: string[];
  tokenUsageMillions?: number;
  inactiveSeats30d: number;
  reclaimableMonthlySavings: number;
  ownerName: string;
  ownerEmail: string;
  renewalDate: string;
  description: string;
}

export interface DepartmentPolicy {
  department: DepartmentName;
  approvedCap: number;
  projectedEomSpend: number;
  projectedOverrunDate: string | null;
  alertThreshold: 80 | 90;
  slackNotify: boolean;
  deptHead: string;
  slackChannel: string;
  unapprovedToolCountExtra: number; // Additional tail unapproved browser/OAuth tools detected in feed
}

export interface PMRationalePinData {
  id: number;
  sectionKey: 'kpis' | 'dept-pacing' | 'shadow-split' | 'quadrant' | 'action-queue' | 'ledger';
  title: string;
  targetPersona: 'CFO / FinOps' | 'CISO / IT Security' | 'CFO + CISO Joint';
  problemSolved: string;
  designDecision: string;
  businessImpact: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  variant: 'emerald' | 'indigo' | 'amber' | 'rose';
  timestamp: string;
}

