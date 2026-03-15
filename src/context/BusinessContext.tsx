import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useFetchbusinessQuery, useUpdatebusinessMutation } from "../services/businessApi";

export type Business = {
  _id: string;
  business_name: string;
  postal_address: string;
  phone_number: string;
  contact_number: string;
  kra_pin: string;
  api_key: string;
};

type BusinessContextType = {
  business: Business | null;
  updateBusiness: (data: Business) => Promise<void>;
  isLoading: boolean;
  isUpdating: boolean;
};

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const { data: businessData, isLoading } = useFetchbusinessQuery({});
  const [updateBusinessMutation, { isLoading: isUpdating }] = useUpdatebusinessMutation();
  const [business, setBusiness] = useState<Business | null>(null);

  // Sync API data into context only if it differs
  useEffect(() => {
    if (businessData && JSON.stringify(business) !== JSON.stringify(businessData)) {
      setBusiness(businessData);
    }
  }, [businessData]);

  // Update business on server, then context
  const updateBusiness = async (newData: Business) => {
    try {
      await updateBusinessMutation(newData).unwrap();
      setBusiness(newData); // only update after mutation success
    } catch (err) {
      console.error("Failed to update business:", err);
    }
  };

  return (
    <BusinessContext.Provider value={{ business, updateBusiness, isLoading, isUpdating }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) throw new Error("useBusiness must be used within a BusinessProvider");
  return context;
};