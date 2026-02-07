import { useState, useEffect } from "react";
const SIDEBAR_STATE_KEY = "sidebar_visible";
export function useSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (savedState !== null) {
      setIsOpen(JSON.parse(savedState));
    }
    setMounted(true);
  }, []);
  const toggleSidebar = () => {
    setIsOpen((prev) => {
      const newState = !prev;
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(newState));
      return newState;
    });
  };
  return {
    isOpen,
    toggleSidebar,
    mounted,
  };
}