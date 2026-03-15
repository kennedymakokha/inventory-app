// src/utility/authorisedFetch.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

export const authorizedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<any> => {

  try {

    const token = await AsyncStorage.getItem('accessToken');

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch (err) {

      console.error(" Server returned NON JSON");
      console.error("URL:", url);
      console.error("Response:", text);

      throw new Error("Server returned invalid JSON");
    }

    if (!response.ok) {
      console.error(" API Error:", data);
      throw new Error(data?.message || "API request failed");
    }

    return data;

  } catch (err) {

    console.error('authorizedFetch error:', err);
    throw err;

  }
};