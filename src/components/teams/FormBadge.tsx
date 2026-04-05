import { getFormColor, parseForm } from '@/lib/utils'

interface FormBadgeProps {
  form: string  // e.g. "WWDLW"
}

export function FormBadge({ form }: FormBadgeProps) {
  const results = parseForm(form)

  return (
    <div className="flex gap-1">
      {results.map((result, i) => (
        <span
          key={i}
          className={`${getFormColor(result)} w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold`}
        >
          {result}
        </span>
      ))}
    </div>
  )
}
