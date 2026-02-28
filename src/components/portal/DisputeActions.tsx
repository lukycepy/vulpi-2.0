"use client"

import { useState } from "react"
import { resolveDispute, rejectDispute } from "@/actions/portal"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Check, X } from "lucide-react"

interface DisputeActionsProps {
  disputeId: string
}

export function DisputeActions({ disputeId }: DisputeActionsProps) {
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState<"resolve" | "reject" | null>(null)
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAction = async () => {
    if (!action) return
    setLoading(true)
    
    try {
      if (action === "resolve") {
        await resolveDispute(disputeId, response)
      } else {
        await rejectDispute(disputeId, response)
      }
      setOpen(false)
      setAction(null)
      setResponse("")
    } catch (error) {
      console.error(error)
      alert("Chyba při zpracování")
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (type: "resolve" | "reject") => {
    setAction(type)
    setOpen(true)
  }

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => openDialog("resolve")}>
          <Check className="h-4 w-4 mr-1" />
          Vyřešit
        </Button>
        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => openDialog("reject")}>
          <X className="h-4 w-4 mr-1" />
          Zamítnout
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "resolve" ? "Vyřešit reklamaci" : "Zamítnout reklamaci"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Odpověď pro klienta:</label>
            <Textarea 
              value={response} 
              onChange={(e) => setResponse(e.target.value)} 
              placeholder={action === "resolve" ? "Reklamaci uznáváme..." : "Reklamaci zamítáme z důvodu..."}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Zrušit
            </Button>
            <Button 
              onClick={handleAction} 
              disabled={loading || !response}
              variant={action === "reject" ? "destructive" : "default"}
            >
              {loading ? "Zpracovávám..." : (action === "resolve" ? "Potvrdit vyřešení" : "Potvrdit zamítnutí")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
