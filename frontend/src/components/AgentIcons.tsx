import { Cloud, FileText, Divide, Smile, Terminal, Search, Globe, Database, ShieldCheck, Zap, Cpu, type LucideIcon } from 'lucide-react';

export const AgentIconMap: Record<string, LucideIcon> = {
  weather: Cloud,
  summarize: FileText,
  'math-solve': Divide,
  sentiment: Smile,
  'code-explain': Terminal,
  research: Search,
  translate: Globe,
  kaggleingest: Database,
  arbitrator: ShieldCheck,
  manager: Cpu,
  'code-agent': Terminal,
};

export const getAgentIcon = (id: any): LucideIcon => {
  if (!id) return Zap;
  const baseId = String(id).toLowerCase();
  return AgentIconMap[baseId] || Zap;
};

export const AgentColors: Record<string, string> = {
  weather:      '#16a34a', // green
  summarize:    '#15803d', // dark green
  'math-solve': '#059669', // emerald
  sentiment:    '#16a34a', // green
  'code-explain':'#15803d',
  research:     '#059669',
  translate:    '#16a34a',
  kaggleingest: '#15803d',
  arbitrator:   '#059669',
  manager:      '#16a34a',
  'code-agent': '#15803d',
};

export const getAgentColor = (id: any) => {
  if (!id) return '#64748b';
  const baseId = String(id).toLowerCase();
  return AgentColors[baseId] || '#64748b'; // muted
};
