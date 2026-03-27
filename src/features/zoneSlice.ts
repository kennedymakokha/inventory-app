// zoneSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Business {
  working_hrs?: string;
  primary_color?: string;
  secondary_color?: string;
}

interface User {
  role?: string;
}

interface ZoneState {
  isWithinZones: boolean;
  isOutOfHours: boolean;
  shouldLock: boolean;
  inactive: boolean;
  primaryColor: string;
  secondaryColor: string;
}

//  Constants
const INACTIVE_PRIMARY = "#868688";
const INACTIVE_SECONDARY = "#f3f4f6";
const DEFAULT_PRIMARY = "#3c58a8";
const DEFAULT_SECONDARY = "#ffffff";

//  Helper
const isOutsideWorkingHours = (
  start: number,
  end: number,
  currentHour: number
) => {
  if (start === end) return false;
  if (start < end) return currentHour < start || currentHour >= end;
  return currentHour >= end && currentHour < start;
};

const initialState: ZoneState = {
  isWithinZones: false,
  isOutOfHours: false,
  shouldLock: true,
  inactive: true,
  primaryColor: INACTIVE_PRIMARY,
  secondaryColor: "#fff",
};

const zoneSlice = createSlice({
  name: 'zone',
  initialState,
  reducers: {
    setZoneStatus: (state, action: PayloadAction<boolean>) => {
      state.isWithinZones = action.payload;
    },

    evaluateStatus: (
      state,
      action: PayloadAction<{
        business: Business;
        user: User;
      }>
    ) => {
      const { business, user } = action.payload;

      const currentHour = new Date().getHours();

      //  Safe parsing of working hours
      const parts = (business?.working_hrs || "0-0").split("-");
      let start = 0;
      let end = 0;

      if (parts.length === 2) {
        const s = Number(parts[0]);
        const e = Number(parts[1]);

        if (!isNaN(s) && !isNaN(e)) {
          start = s;
          end = e;
        }
      }

      //  Time logic
      const isOutOfHours = isOutsideWorkingHours(start, end, currentHour);
      state.isOutOfHours = isOutOfHours;

      //  Zone logic
      const isOutOfZone = !state.isWithinZones;

      //  Final decision
      const shouldBeInactive =
        user?.role?.toLowerCase() === "sales" &&
        (isOutOfHours || isOutOfZone);

      state.inactive = shouldBeInactive;
      state.shouldLock = shouldBeInactive;

      //  Theme update
      if (shouldBeInactive) {
        state.primaryColor = INACTIVE_PRIMARY;
        state.secondaryColor = INACTIVE_SECONDARY;
      } else {
        state.primaryColor = business?.primary_color || DEFAULT_PRIMARY;
        state.secondaryColor = business?.secondary_color || DEFAULT_SECONDARY;
      }
    },
  },
});

export const { setZoneStatus, evaluateStatus } = zoneSlice.actions;
export default zoneSlice.reducer;