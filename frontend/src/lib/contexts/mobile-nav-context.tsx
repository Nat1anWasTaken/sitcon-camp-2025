"use client";

import React, { createContext, useContext, useState } from "react";

interface MobileNavContextType {
  showContent: boolean;
  setShowContent: (show: boolean) => void;
  activeContactName?: string;
  setActiveContactName: (name?: string) => void;
  isSiriActive: boolean;
  setIsSiriActive: (active: boolean) => void;
}

const MobileNavContext = createContext<MobileNavContextType | undefined>(
  undefined
);

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [showContent, setShowContent] = useState(false);
  const [activeContactName, setActiveContactName] = useState<string>();
  const [isSiriActive, setIsSiriActive] = useState(false);

  return (
    <MobileNavContext.Provider
      value={{
        showContent,
        setShowContent,
        activeContactName,
        setActiveContactName,
        isSiriActive,
        setIsSiriActive,
      }}
    >
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const context = useContext(MobileNavContext);
  if (context === undefined) {
    throw new Error("useMobileNav must be used within a MobileNavProvider");
  }
  return context;
}
