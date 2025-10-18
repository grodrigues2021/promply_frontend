import React from 'react'
const Textarea = React.forwardRef(({ className = "", ...props }, ref) => {
  const classes = `flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`
  
  return (
    <textarea
      ref={ref}
      className={classes}
      {...props}
    />
  )
})

Textarea.displayName = "Textarea"

export { Textarea }
