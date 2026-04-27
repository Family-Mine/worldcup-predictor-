'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'

type Provider = 'google' | 'apple'

interface Props {
  locale: string
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <path d="M13.173 9.389c-.017-1.762 1.435-2.613 1.5-2.655-1.1-1.398-2.607-1.448-3.106-1.465-1.313-.134-2.576.78-3.243.78-.668 0-1.681-.765-2.77-.744C3.989 5.33 2.4 6.49 1.543 8.19c-1.718 2.97-.44 7.352 1.216 9.758.82 1.178 1.79 2.494 3.064 2.447 1.234-.05 1.7-.79 3.193-.79 1.493 0 1.918.79 3.22.764 1.327-.023 2.164-1.186 2.97-2.37a10.7 10.7 0 0 0 1.355-2.746c-.033-.014-2.571-1.002-2.588-3.864zM10.647 3.5c.664-.82 1.113-1.95.99-3.082-.957.04-2.14.645-2.83 1.448-.61.706-1.15 1.858-.956 2.963 1.073.08 2.17-.55 2.796-1.329z"/>
    </svg>
  )
}

const providerConfig = {
  google: { label: 'Google', Icon: GoogleIcon, bg: 'bg-white', text: 'text-gray-700', border: 'border-gray-300 hover:border-gray-400' },
  apple:  { label: 'Apple',  Icon: AppleIcon,  bg: 'bg-black', text: 'text-white',    border: 'border-black hover:border-gray-700' },
}

export function SocialAuthButtons({ locale }: Props) {
  const [loading, setLoading] = useState<Provider | null>(null)

  async function handleOAuth(provider: Provider) {
    setLoading(provider)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${appUrl}/api/auth/callback?locale=${locale}&flow=oauth`,
      },
    })
  }

  return (
    <div className="space-y-3">
      {(['google', 'apple'] as Provider[]).map((provider) => {
        const { label, Icon, bg, text, border } = providerConfig[provider]
        return (
          <button
            key={provider}
            type="button"
            onClick={() => handleOAuth(provider)}
            disabled={loading !== null}
            className={`w-full flex items-center justify-center gap-3 ${bg} ${text} border ${border} font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <Icon />
            {loading === provider ? 'Redirecting…' : `Continue with ${label}`}
          </button>
        )
      })}
    </div>
  )
}
