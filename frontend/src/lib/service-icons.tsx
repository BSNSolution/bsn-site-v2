import {
  Brain,
  Database,
  Scissors,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
  Cpu,
  LineChart,
  Bot,
  Workflow,
  FileSearch,
  Gauge,
  Clock,
  Code,
  Users,
  Compass,
  Server,
  LifeBuoy,
  Handshake,
  Rocket,
  Palette,
} from 'lucide-react'

export const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'trending-up': TrendingUp,
  scissors: Scissors,
  zap: Zap,
  brain: Brain,
  database: Database,
  shield: Shield,
  sparkles: Sparkles,
  cpu: Cpu,
  'line-chart': LineChart,
  bot: Bot,
  workflow: Workflow,
  'file-search': FileSearch,
  gauge: Gauge,
  clock: Clock,
  code: Code,
  users: Users,
  compass: Compass,
  server: Server,
  'life-buoy': LifeBuoy,
  handshake: Handshake,
  rocket: Rocket,
  palette: Palette,
}

export function renderServiceIcon(
  name?: string | null,
  className = 'svc-detail-ico-svg',
  fallback: React.ComponentType<{ className?: string }> = Sparkles
) {
  const Icon = (name && SERVICE_ICONS[name]) || fallback
  return <Icon className={className} />
}
