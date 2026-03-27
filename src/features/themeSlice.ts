import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ThemeState {
  primary: string;
  secondary: string;
}

const initialState: ThemeState = {
  primary: "#3c58a8",
  secondary: "#ffffff",
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeColors: (state, action: PayloadAction<{ primary: string; secondary: string }>) => {
      state.primary = action.payload.primary;
      state.secondary = action.payload.secondary;
    },
  },
});

export const { setThemeColors } = themeSlice.actions;
export default themeSlice.reducer;