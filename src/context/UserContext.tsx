import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useFetchuserQuery, useUpdateuserMutation } from "../services/authApi";

type User = {
    _id: string;
    name: string;
    email: string;
    phone_number: string;
};

type UserContextType = {
    user: User | null;
    setUser: (data: User) => void;
    updateUser: (data: User) => Promise<void>;
    isLoading: boolean;
    isUpdating: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const { data: userData, refetch, isLoading } = useFetchuserQuery({});
    const [updateUserMutation, { isLoading: isUpdating }] = useUpdateuserMutation();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (userData) setUser(userData);
    }, [userData]);

    const updateUser = async (data: User) => {
        await updateUserMutation(data).unwrap();
        await refetch();
        setUser(data);
    };

    return (
        <UserContext.Provider value={{ user, setUser, updateUser, isLoading, isUpdating }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within a UserProvider");
    return context;
};