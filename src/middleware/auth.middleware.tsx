// src/utility/authorisedFetch.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

export const authorizedFetch = async (
    url: string,
    options: RequestInit = {}
): Promise<any> => {
    try {
        const token = await AsyncStorage.getItem('accessToken');
        // console.log("Token", token)
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
        };
        const response = await fetch(url, {
            ...options,
            headers,
        });
        const json = await response.json();
        return json;
    } catch (err) {
        console.error('authorizedFetch error:', err);
        throw err;
    }
};
