"use client";

import React, { ReactNode } from "react";
import { InstitutionProvider } from "@/app/context/InstitutionContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <InstitutionProvider>
      {children}
    </InstitutionProvider>
  );
}
