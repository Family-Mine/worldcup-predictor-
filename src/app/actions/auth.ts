'use server'
// src/app/actions/auth.ts
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const locale = (formData.get('locale') as string) || 'en'

  const supabase = getSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  return { success: true, locale }
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const locale = (formData.get('locale') as string) || 'en'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const supabase = getSupabaseServerClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/api/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, locale }
}

export async function signOut(locale: string) {
  const supabase = getSupabaseServerClient()
  await supabase.auth.signOut()
  redirect(`/${locale}`)
}
