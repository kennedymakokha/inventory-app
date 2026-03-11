import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProductItem, CartItem } from '../../models';

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: ProductItem, quantity: number, price?: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType>({
    cart: [],
    addToCart: () => { },
    removeFromCart: () => { },
    clearCart: () => { },
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<CartItem[]>([]);

    const addToCart = (product: ProductItem, quantity: number, price?: number) => {
        setCart((prev: any) => {
            const existing = prev.find((item: any) => item.id === product.id);
            if (existing) {
                return prev.map((item: any) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity, price: price ?? item.price }
                        : item
                );
            } else {
                return [...prev, { ...product, quantity, price: price ?? product.price }];
            }
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const clearCart = () => setCart([]);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);