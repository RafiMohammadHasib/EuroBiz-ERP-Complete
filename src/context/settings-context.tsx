
'use client';

import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';

type Currency = 'BDT' | 'USD';

type BusinessSettings = {
    name: string;
    address: string;
    email: string;
    phone: string;
    logoUrl: string;
    currency?: Currency;
};

interface SettingsContextType {
  currency: Currency;
  currencySymbol: string;
  setCurrency: (currency: Currency) => void;
  businessSettings: BusinessSettings;
  setBusinessSettings: Dispatch<SetStateAction<BusinessSettings>>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
  initialBusinessSettings: BusinessSettings;
}

export function SettingsProvider({ children, initialBusinessSettings }: SettingsProviderProps) {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(initialBusinessSettings);
  const [currency, setCurrency] = useState<Currency>(initialBusinessSettings.currency || 'BDT');

  useEffect(() => {
    setBusinessSettings(initialBusinessSettings);
    setCurrency(initialBusinessSettings.currency || 'BDT');
  }, [initialBusinessSettings]);

  const currencySymbol = currency === 'USD' ? '$' : '৳';

  const value = {
    currency,
    currencySymbol,
    setCurrency,
    businessSettings,
    setBusinessSettings,
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
