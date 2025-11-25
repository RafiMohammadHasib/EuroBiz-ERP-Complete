'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

type Currency = 'BDT' | 'USD';

interface SettingsContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  // Add other settings here in the future
}

// Define a type for your settings document
type BusinessSettings = {
    currency?: Currency;
    // other fields
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('BDT');
  const firestore = useFirestore();
  const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'business') : null, [firestore]);
  const { data: settingsData } = useDoc<BusinessSettings>(settingsDocRef);
  
  useEffect(() => {
    if (settingsData?.currency) {
      setCurrency(settingsData.currency);
    }
  }, [settingsData]);


  const value = {
    currency,
    setCurrency,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
