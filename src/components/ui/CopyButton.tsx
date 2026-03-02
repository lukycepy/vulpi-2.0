"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  label?: string
}

export function CopyButton({ value, label, className, ...props }: CopyButtonProps) {
  const { toast } = useToast()
  const [hasCopied, setHasCopied] = React.useState(false)

  React.useEffect(() => {
    if (hasCopied) {
      const timeout = setTimeout(() => {
        setHasCopied(false)
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [hasCopied])

  const copyToClipboard = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (typeof window === "undefined" || !navigator.clipboard?.writeText) {
      return
    }

    if (!value) {
      return
    }

    navigator.clipboard.writeText(value).then(() => {
      setHasCopied(true)
      toast({
        title: "Zkopírováno",
        description: `Hodnota "${value}" byla zkopírována do schránky.`,
      })
    })
  }, [value, toast])

  return (
    <Button
      size="icon"
      variant="ghost"
      className={cn("h-6 w-6 relative z-10 text-muted-foreground hover:bg-muted hover:text-foreground", className)}
      onClick={copyToClipboard}
      title="Kopírovat"
      type="button"
      {...props}
    >
      <span className="sr-only">Kopírovat</span>
      {hasCopied ? (
        <Check className="h-3 w-3" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  )
}
