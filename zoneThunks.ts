import { evaluateStatus, setZoneStatus } from "./src/features/zoneSlice";
import { clockIn, clockOut } from "./src/services/users.service";
import { RootState } from "./store";
import { ThunkAction } from "@reduxjs/toolkit";
import { AnyAction } from "redux";

type AppThunk = ThunkAction<void, RootState, unknown, AnyAction>;

interface Business { _id?: string; working_hrs?: string; primary_color?: string; secondary_color?: string; }
interface User { _id?: string; role?: string; business?: { _id?: string }; }

let lastTransition = 0;
const MIN_INTERVAL = 5000;

export const handleGeofence = (isInside: boolean, business: Business | null, user: User | null): AppThunk =>
    async (dispatch, getState) => {
        if (!business || !user) return;

        const now = Date.now();
        if (now - lastTransition < MIN_INTERVAL) return;
        lastTransition = now;

        const state = getState().zone;
        console.log(state)
        const prevInactive = state.inactive;

        if (state.isWithinZones !== isInside) dispatch(setZoneStatus(isInside));
        dispatch(evaluateStatus({ business, user }));

        const nextInactive = getState().zone.inactive;
        if (prevInactive !== nextInactive) {
            try {
                if (nextInactive) await clockOut(`${user._id}`);
                else await clockIn({ user_id: `${user._id}`, business_id: `${user.business?._id}` });
            } catch (err) { console.error("Clock action failed:", err); }
        }
    };

export const runStatusCheck = (business: Business | null, user: User | null): AppThunk =>
    (dispatch) => {
        if (!business || !user) return;
        dispatch(evaluateStatus({ business, user }));
    };