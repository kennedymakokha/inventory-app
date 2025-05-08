import { useRef } from 'react';

export function useDoubleTap(callback: any, delay = 300) {
    const lastTap: any = useRef(null);

    return () => {
        const now = Date.now();
        if (lastTap.current && (now - lastTap.current) < delay) {
            callback(); // Double tap detected
        } else {
            lastTap.current = now;
        }
    };
}