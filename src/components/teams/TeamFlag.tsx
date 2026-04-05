import Image from 'next/image'

const sizes = {
  sm: { displayW: 24, displayH: 16, fetchW: 40, container: 'w-6 h-4' },
  md: { displayW: 40, displayH: 27, fetchW: 80, container: 'w-10 h-7' },
  lg: { displayW: 64, displayH: 43, fetchW: 160, container: 'w-16 h-11' },
  xl: { displayW: 96, displayH: 64, fetchW: 160, container: 'w-24 h-16' },
}

interface TeamFlagProps {
  countryCode: string   // lowercase ISO 3166-1 alpha-2, e.g. 'co', 'pt', 'gb-eng'
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function TeamFlag({ countryCode, name, size = 'md', className = '' }: TeamFlagProps) {
  const { displayW, displayH, fetchW, container } = sizes[size]
  const flagUrl = `https://flagcdn.com/w${fetchW}/${countryCode.toLowerCase()}.png`

  return (
    <div className={`${container} ${className} relative overflow-hidden rounded-sm flex-shrink-0`}>
      <Image
        src={flagUrl}
        alt={name}
        width={displayW}
        height={displayH}
        className="object-cover w-full h-full"
        unoptimized
      />
    </div>
  )
}
