"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface SelectContextType {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  labels: Record<string, React.ReactNode>
  registerLabel: (value: string, label: React.ReactNode) => void
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined)

const Select = ({ value, onValueChange, children }: any) => {
  const [open, setOpen] = React.useState(false)
  const [labels, setLabels] = React.useState<Record<string, React.ReactNode>>({})

  const registerLabel = React.useCallback((val: string, label: React.ReactNode) => {
    setLabels(prev => {
      if (prev[val] === label) return prev
      return { ...prev, [val]: label }
    })
  }, [])

  // Close on click outside (simple version)
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, labels, registerLabel }}>
      <div ref={ref} className="relative inline-block w-full">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = ({ className, children }: any) => {
  const { open, setOpen } = React.useContext(SelectContext)!
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

const SelectValue = ({ placeholder, children }: any) => {
  const { value, labels } = React.useContext(SelectContext)!
  
  // If children are provided (as a fallback or override), usage might be different.
  // Standard Radix SelectValue doesn't usually take children for the value itself, but for placeholder.
  
  const displayValue = labels[value] || value || placeholder

  return (
    <span style={{ pointerEvents: "none" }} className="block truncate">
      {displayValue}
    </span>
  )
}

const SelectContent = ({ className, children }: any) => {
  const { open } = React.useContext(SelectContext)!
  // We hide instead of unmount to allow label registration
  return (
    <div className={cn(
      "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md w-full mt-1",
      !open && "hidden",
      className
    )}>
      <div className="p-1 max-h-60 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

const SelectItem = ({ value, children, className }: any) => {
  const { onValueChange, setOpen, value: selectedValue, registerLabel } = React.useContext(SelectContext)!
  
  React.useEffect(() => {
    registerLabel(value, children)
  }, [value, children, registerLabel])

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        onValueChange(value)
        setOpen(false)
      }}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer",
        selectedValue === value && "bg-accent text-accent-foreground",
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {selectedValue === value && <span className="h-2 w-2 rounded-full bg-current" />}
      </span>
      {children}
    </div>
  )
}

const SelectGroup = ({ children }: any) => <div>{children}</div>
const SelectLabel = ({ children }: any) => <div className="px-2 py-1.5 text-sm font-semibold">{children}</div>
const SelectSeparator = () => <div className="-mx-1 my-1 h-px bg-muted" />

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator }
