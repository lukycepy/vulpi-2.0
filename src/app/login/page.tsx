"use client"

import { useState } from "react"
import { login, verifyTwoFactorLogin } from "@/actions/auth"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Chrome } from "lucide-react"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [twoFactorUserId, setTwoFactorUserId] = useState<string | null>(null)
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Show error from URL if present
  const urlError = searchParams.get("error");
  if (urlError && !error) setError(urlError);

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    try {
      const result = await login(formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.requires2FA && result.userId) {
        setRequiresTwoFactor(true)
        setTwoFactorUserId(result.userId)
        setLoading(false)
      } else if (result?.success) {
        router.push("/")
        router.refresh()
      }
    } catch (e) {
      console.error(e)
      setError("Neočekávaná chyba při přihlášení")
      setLoading(false)
    }
  }

  async function handleTwoFactorSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!twoFactorUserId || !twoFactorCode) return

    setLoading(true)
    setError(null)

    try {
      const result = await verifyTwoFactorLogin(twoFactorUserId, twoFactorCode)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.success) {
        router.push("/")
        router.refresh()
      }
    } catch (e) {
      console.error(e)
      setError("Chyba při ověření kódu")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Vulpi
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {requiresTwoFactor ? "Zadejte ověřovací kód" : "Přihlaste se do svého účtu"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm text-center border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {requiresTwoFactor ? (
          <form onSubmit={handleTwoFactorSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ověřovací kód (6 číslic)
              </label>
              <input
                id="code"
                name="code"
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                autoComplete="one-time-code"
                required
                maxLength={6}
                className="relative block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-center tracking-widest text-2xl"
                placeholder="000000"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-10 items-center"
              >
                {loading ? "Ověřování..." : "Ověřit"}
              </button>
            </div>
          </form>
        ) : (
          <form action={handleSubmit} className="mt-8 space-y-6">
            <div className="-space-y-px rounded-md shadow-sm">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email nebo Login
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  className="relative block w-full rounded-t-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600"
                  placeholder="Email nebo Uživatelské jméno"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Heslo
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="relative block w-full rounded-b-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600"
                  placeholder="Heslo"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                  Zapomněli jste heslo?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Přihlašování...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Chrome className="h-5 w-5 text-indigo-200 group-hover:text-indigo-100" />
                    Přihlásit se
                  </span>
                )}
              </button>
            </div>
          </form>
        )}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">Nebo</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.location.href = "/api/auth/google"}
          className="flex w-full justify-center items-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
        >
          <Chrome className="h-5 w-5 text-red-500" />
          Přihlásit se přes Google
        </button>
      </div>
    </div>
  )
}
