import React, { createContext, useContext } from 'react'

export const DEFAULT_BRAND_COLOR = '#2563EB'

interface BrandContextValue {
  primaryColor: string
  logoUrl: string | null
  professionalName: string | null
}

const BrandContext = createContext<BrandContextValue>({
  primaryColor: DEFAULT_BRAND_COLOR,
  logoUrl: null,
  professionalName: null,
})

export function BrandProvider({
  primaryColor,
  logoUrl,
  professionalName,
  children,
}: BrandContextValue & { children: React.ReactNode }) {
  return (
    <BrandContext.Provider value={{ primaryColor, logoUrl, professionalName }}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand(): BrandContextValue {
  return useContext(BrandContext)
}
