// store/cartSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CartItem, ProductItem } from "../../models";



interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (
      state,
      action: PayloadAction<{ product: ProductItem; quantity: number; price: number }>
    ) => {
      const { product, quantity, price } = action.payload;
      const existing = state.items.find((i) => i.id === product.id);

      if (existing) {
        existing.quantity = quantity;
        existing.price = price;
      } else {
        state.items.push({ ...product, quantity, price });
      }

      // Remove if quantity is 0
      state.items = state.items.filter((i) => i.quantity > 0);
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addToCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
