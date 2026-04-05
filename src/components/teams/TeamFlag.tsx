import Image from 'next/image'

const sizes = {
  sm: { width: 24, height: 16, container: 'w-6 h-4' },
  md: { width: 40, height: 27, container: 'w-10 h-7' },
  lg: { width: 64, height: 43, container: 'w-16 h-11' },
  xl: { width: 96, height: 64, container: 'w-24 h-16' },
}

interface TeamFlagProps {
  countryCode: string   // lowercase ISO 3166-1 alpha-2, e.g. 'co', 'pt', 'gb-eng'
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function TeamFlag({ countryCode, name, size = 'md', className = '' }: TeamFlagProps) {
  const { width, height, container } = sizes[size]
  const flagUrl = `https://flagcdn.com/w${width * 2}/${countryCode.toLowerCase()}.png`

  return (
    <div className={`${container} ${className} relative overflow-hidden rounded-sm flex-shrink-0`}>
      <Image
        src={flagUrl}
        alt={name}
        width={width * 2}
        height={height * 2}
        className="object-cover w-full h-full"
        unoptimized
      />
    </div>
  )
}
