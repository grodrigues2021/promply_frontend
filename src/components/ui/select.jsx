import React from 'react'
import { useState } from "react"

const SelectContext = React.createContext()

const Select = ({ children, value, onValueChange }) => {
  const [open, setOpen] = useState(false)
  
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef(({ className = "", children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(SelectContext)
  
  const classes = `flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`
  
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setOpen(!open)}
      className={classes}
      {...props}
    >
      {children}
      <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
})

SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext)
  return <span>{value || placeholder}</span>
}

const SelectContent = React.forwardRef(({ className = "", children, ...props }, ref) => {
  const { open } = React.useContext(SelectContext)
  
  if (!open) return null
  
  const classes = `absolute z-50 mt-1 max-h-96 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg ${className}`
  
  return (
    <div
      ref={ref}
      className={classes}
      {...props}
    >
      {children}
    </div>
  )
})

SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef(({ className = "", value, children, ...props }, ref) => {
  const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext)
  
  const handleClick = () => {
    onValueChange(value)
    setOpen(false)
  }
  
  const classes = `relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-gray-100 ${selectedValue === value ? 'bg-blue-50' : ''} ${className}`
  
  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={classes}
      {...props}
    >
      {children}
    </div>
  )
})

SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
