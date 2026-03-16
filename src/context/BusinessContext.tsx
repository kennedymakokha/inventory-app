import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { useFetchbusinessQuery } from "../services/businessApi";

export type Business = {
  _id: string;
  business_name: string;
  postal_address: string;
  phone_number: string;
  contact_number: string;
  working_hrs: string
  kra_pin: string;
  printQr: boolean
  api_key: string;
  latitude: number;
  longitude: number;
};

type State = {
  business: Business | null;
};

type Action =
  | { type: "SET_BUSINESS"; payload: Business }
  | { type: "UPDATE_BUSINESS"; payload: Partial<Business> };

type BusinessContextType = {
  business: Business | null;
  updateBusiness: (data: Business) => void;
  isLoading: boolean;
};

const BusinessContext = createContext<BusinessContextType | undefined>(
  undefined
);

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_BUSINESS":
      return { ...state, business: action.payload };

    case "UPDATE_BUSINESS":
      return {
        ...state,
        business: state.business
          ? { ...state.business, ...action.payload }
          : action.payload as Business,
      };

    default:
      return state;
  }
};

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const { data: businessData, isLoading } = useFetchbusinessQuery({});

  const [state, dispatch] = useReducer(reducer, {
    business: null,
  });

  // Load API data into context
  useEffect(() => {
    if (businessData && businessData._id) {
      dispatch({ type: "SET_BUSINESS", payload: businessData });
    }
  }, [businessData]);

  // Update ONLY context state
  const updateBusiness = (data: Business) => {
    dispatch({ type: "UPDATE_BUSINESS", payload: data });
  };

  return (
    <BusinessContext.Provider
      value={{
        business: state.business,
        updateBusiness,
        isLoading,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useBusiness must be used within a BusinessProvider");
  }
  return context;
};