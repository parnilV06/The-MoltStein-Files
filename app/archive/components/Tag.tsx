type TagProps = {
  label: string
  tone?: 'default' | 'reason'
}

const toneClasses: Record<NonNullable<TagProps['tone']>, string> = {
  default: 'border-zinc-700/80 text-zinc-200 bg-zinc-900/60',
  reason: 'border-[#E01B24]/60 text-[#E01B24] bg-[#E01B24]/10'
}

export default function Tag({ label, tone = 'default' }: TagProps) {
  const classes = toneClasses[tone]

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.2em] ${classes}`}
    >
      {label}
    </span>
  )
}
