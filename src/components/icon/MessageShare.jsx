import * as React from "react";

const MessageShare = React.forwardRef(
  ({ size = 24, color = "currentColor", ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Balão de mensagem */}
      <path d="M21 10c0 4.418-4.03 8-9 8-1.34 0-2.61-.25-3.75-.7L3 19l1.17-3.51C3.43 14.21 3 12.87 3 11c0-4.418 4.03-8 9-8s9 3.582 9 8z" />

      {/* Símbolo Share2 */}
      <circle cx="16" cy="12" r="1" />
      <circle cx="19" cy="6" r="1" />
      <circle cx="19" cy="18" r="1" />
      <path d="M16 12 L19 6" />
      <path d="M16 12 L19 18" />
    </svg>
  )
);

MessageShare.displayName = "MessageShare";

export default MessageShare;
