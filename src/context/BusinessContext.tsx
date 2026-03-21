import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { useFetchbusinessQuery } from "../services/businessApi";

export type Business = {
  _id: string;
  business_name: string;
  logo: string;
  postal_address: string;
  phone_number: string;
  primary_color: string;
  contact_number: string;
  secondary_color: string;
  working_hrs: string;
  kra_pin: string;
  printQr: boolean;
  api_key: string;
  latitude: number;
  longitude: number;
  strictMpesa:boolean;

};

type State = {
  business: Business | null;
};

type Action =
  | { type: "SET_BUSINESS"; payload: Business }
  | { type: "UPDATE_BUSINESS"; payload: Partial<Business> }
  | { type: "RESET_BUSINESS" };

type BusinessContextType = {
  business: Business | null;
  updateBusiness: (data: Business) => void;
  clearBusiness: () => void;
  isLoading: boolean;
};

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_BUSINESS":
      return { ...state, business: action.payload };
    case "UPDATE_BUSINESS":
      return {
        ...state,
        business: state.business ? { ...state.business, ...action.payload } : (action.payload as Business),
      };
    case "RESET_BUSINESS":
      return { ...state, business: null };
    default:
      return state;
  }
};

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const { data: businessData, isLoading } = useFetchbusinessQuery({}, { refetchOnMountOrArgChange: true });
  const [state, dispatch] = useReducer(reducer, { business: null });

  useEffect(() => {
    if (businessData && businessData._id) {
      dispatch({ type: "SET_BUSINESS", payload: businessData });
    }
  }, [businessData]);

  const updateBusiness = (data: Business) => {
    dispatch({ type: "UPDATE_BUSINESS", payload: data });
  };

  const clearBusiness = () => {
    dispatch({ type: "RESET_BUSINESS" });
  };

  return (
    <BusinessContext.Provider value={{ business: state.business, updateBusiness, clearBusiness, isLoading }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) throw new Error("useBusiness must be used within a BusinessProvider");
  return context;
};