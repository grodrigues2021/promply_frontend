import { useLayoutEffect } from "react";

export default function useLockBodyScroll(isLocked) {
  useLayoutEffect(() => {
    if (isLocked) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = original);
    }
  }, [isLocked]);
}
