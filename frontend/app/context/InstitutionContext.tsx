"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { LeadResearchContact } from "@/types/lead";

export interface InstitutionData {
  name?: string;
  institution_name: string;
  location: string;
  size?: string;
  institution_size?: string;
  student_size?: string;
  contacts: LeadResearchContact[];
  pain_points: string[];
  recommended_approach: string;
  website?: string;
  confidence_score?: number;
}

interface InstitutionContextType {
  currentInstitutionData: InstitutionData | null;
  setCurrentInstitutionData: (data: InstitutionData | null) => void;
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined);

export function InstitutionProvider({ children }: { children: ReactNode }) {
  const [currentInstitutionData, setCurrentInstitutionData] = useState<InstitutionData | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const savedLead = localStorage.getItem("kalnet_lead_data");
      return savedLead ? JSON.parse(savedLead) as InstitutionData : null;
    } catch {
      return null;
    }
  });

  return (
    <InstitutionContext.Provider value={{ currentInstitutionData, setCurrentInstitutionData }}>
      {children}
    </InstitutionContext.Provider>
  );
}

export function useInstitution() {
  const context = useContext(InstitutionContext);
  if (context === undefined) {
    throw new Error("useInstitution must be used within an InstitutionProvider");
  }
  return context;
}
