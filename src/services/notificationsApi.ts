import { api } from './index';

export const injectEndpoints = api.injectEndpoints({
  endpoints: builder => ({

  
    postNotification: builder.mutation({
      query: (data) => ({
        url: `notifications`,
        method: "POST",
        body: data,
        headers: {
          "x-source": "client"
        }
      })
    }),

  }),
});

export const {
 usePostNotificationMutation
} = injectEndpoints;