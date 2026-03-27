import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clockIn, clockOut } from "../services/users.service";
import { useTheme } from "../context/themeContext";

export const useAppStatus = ({ user, business }: any) => {
    const { applyThemeDirectly } = useTheme();

    const [isWithinZones, setIsWithinZones] = useState(true);
    const [shouldLock, setShouldLock] = useState(false);

    /* ---------------- CORE ENGINE ---------------- */
    const evaluateStatus = async (zoneOverride?: boolean) => {
        try {
            if (!user || user.role?.toLowerCase() !== "sales") return;

            /* ---------- ZONE ---------- */
            const zoneState =
                typeof zoneOverride === "boolean"
                    ? zoneOverride
                    : isWithinZones;

            const isOutOfZone = !zoneState;

            /* ---------- TIME ---------- */
            const currentHour = new Date().getHours();
            const workingHrs = business?.working_hrs || "0-0";
            const [start, end] = workingHrs.split("-").map(Number);

            let isOutOfHours = false;

            if (start !== end) {
                if (start < end) {
                    isOutOfHours = currentHour < start || currentHour >= end;
                } else {
                    isOutOfHours = currentHour >= end && currentHour < start;
                }
            }
            console.log("STATUS", isOutOfHours, start, end)
            /* ---------- FINAL STATE ---------- */
            const shouldBeInactive = isOutOfHours;

            console.log("📊 STATUS CHECK:", {
                isOutOfZone,
                isOutOfHours,
                shouldBeInactive,
            });

            /* ---------- COLORS ---------- */
            const activePrimary = business?.primary_color || "#3c58a8";
            const activeSecondary = business?.secondary_color || "#ffffff";

            const inactivePrimary = "#868688";   // gray
            const inactiveSecondary = "#f3f4f6"; // light gray

            const primary = shouldBeInactive ? inactivePrimary : activePrimary;
            const secondary = shouldBeInactive ? inactiveSecondary : activeSecondary;

            console.log(primary, secondary)

            // 🔥 APPLY THEME INSTANTLY
            applyThemeDirectly(primary, secondary);

            /* ---------- LOCK ---------- */
            setShouldLock(shouldBeInactive);

            /* ---------- PERSIST STATE ---------- */
            await AsyncStorage.setItem("inactive", shouldBeInactive ? "true" : "false");

            /* ---------- CLOCK CONTROL ---------- */
            const lastState = await AsyncStorage.getItem("lastActiveState");

            if (shouldBeInactive && lastState !== "inactive") {
                console.log("⏱ CLOCK OUT");
                await clockOut(user?._id);
                await AsyncStorage.setItem("lastActiveState", "inactive");
            }

            if (!shouldBeInactive && lastState !== "active") {
                console.log("⏱ CLOCK IN");
                await clockIn({
                    user_id: `${user?._id}`,
                    business_id: `${business?._id}`,
                });
                await AsyncStorage.setItem("lastActiveState", "active");
            }

        } catch (err) {
            console.error("❌ evaluateStatus error:", err);
        }
    };

    return {
        isWithinZones,
        setIsWithinZones,
        shouldLock,
        evaluateStatus,
    };
};