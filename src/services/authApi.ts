import { api } from './index'

export const injectEndpoints = api.injectEndpoints({
    endpoints: builder => ({
        signup: builder.mutation({
            query: (body) => ({
                url: '/auth/register',
                method: 'POST',
                body,
            }),
        }),
        activate: builder.mutation({
            query: (body) => ({
                url: '/auth/activate-user',
                method: 'POST',
                body,
            }),
        }),
        login: builder.mutation({
            query: (body) => ({
                url: '/auth/login',
                method: 'POST',
                body,
            }),
        }),
        getSession: builder.query({
            query: () => '/auth',
        }),
        logout: builder.mutation({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
        }),
    }),
});

export const {
    useActivateMutation,
    useSignupMutation,
    useLoginMutation,
    useGetSessionQuery,
    useLogoutMutation,
} = injectEndpoints;
