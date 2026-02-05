import type { Severity } from '@/lib/content'

type SeverityBadgeProps = {
  severity?: Severity
}

const severityClasses: Record<Severity, string> = {
  low: 'border-zinc-700/80 text-zinc-200 bg-zinc-900/60',
  medium: 'border-[#E01B24]/60 text-[#E01B24] bg-[#E01B24]/10',
  high: 'border-orange-500/60 text-orange-200 bg-orange-500/15',
  critical: 'border-red-500/60 text-red-200 bg-red-500/15'
}

export default function SeverityBadge({ severity = 'low' }: SeverityBadgeProps) {
  const classes = severityClasses[severity]

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.25em] ${classes}`}
    >
      {severity}
    </span>
  )
}
