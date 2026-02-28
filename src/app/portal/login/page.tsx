"use client"

import { useState } from "react"
import { verifyClientAccess } from "@/actions/portal"
import { useRouter } from "next/navigation"

export default function ClientPortalLogin() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    try {
      // We'll call the server action directly.
      // Since it redirects on success, we don't need to handle success here if it works.
      // But verifyClientAccess is an async function that might return an error object.
      // If verifyClientAccess uses redirect(), the client-side call might throw or return undefined?
      // In Next.js Server Actions, redirect() on server causes the client router to navigate.
      // If it returns an object, we check for error.
      
      const result = await verifyClientAccess(formData)
      if (result && result.error) {
        setError(result.error)
        setLoading(false)
      } else {
        router.push("/portal")
      }
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Klientský portál
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Zadejte svůj přístupový kód pro zobrazení faktur
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm text-center">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="accessCode" className="sr-only">
                Přístupový kód
              </label>
              <input
                id="accessCode"
                name="accessCode"
                type="text"
                required
                className="relative block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-transparent"
                placeholder="Váš přístupový kód"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Přihlašování..." : "Vstoupit do portálu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
