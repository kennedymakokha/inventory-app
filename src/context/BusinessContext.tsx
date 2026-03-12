import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useFetchbusinessQuery, useUpdatebusinessMutation } from "../services/businessApi";

type Business = {
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
    setBusiness: (data: Business) => void;
    updateBusiness: (data: Business) => Promise<void>;
    isLoading: boolean;
    isUpdating: boolean;
};

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
    const { data: businessData, refetch, isLoading } = useFetchbusinessQuery({});
    const [updateBusinessMutation, { isLoading: isUpdating }] = useUpdatebusinessMutation();
    const [business, setBusiness] = useState<Business | null>(null);

    // Sync API data to context state
    useEffect(() => {
        if (businessData) {
            setBusiness(businessData);
        }
    }, [businessData]);

    // Update business both on server and context
    const updateBusiness = async (data: Business) => {
        await updateBusinessMutation(data).unwrap();
        await refetch();
        setBusiness(data); // update context immediately
    };

    return (
        <BusinessContext.Provider
            value={{ business, setBusiness, updateBusiness, isLoading, isUpdating }}
        >
            {children}
        </BusinessContext.Provider>
    );
};

// Custom hook for easy access
export const useBusiness = () => {
    const context = useContext(BusinessContext);
    if (!context) {
        throw new Error("useBusiness must be used within a BusinessProvider");
    }
    return context;
};