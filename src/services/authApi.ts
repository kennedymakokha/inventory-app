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
        verify: builder.mutation({
            query: (body) => ({
                url: '/auth/verify-otp',
                method: 'POST',
                body,
            }),
        }),
        requestOTP: builder.mutation({
            query: (body) => ({
                url: '/auth/request-otp',
                method: 'POST',
                body,
            }),
        }),
         resetPassword: builder.mutation({
            query: (body) => ({
                url: '/auth/reset-password',
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
        fetchuser: builder.query({
            query: () => `auth/active-user`
        }),
        updateuser: builder.mutation({
            query: (data) => ({
                url: `auth/${data._id}`,
                method: "put",
                body: data
            })
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
    useResetPasswordMutation,
    useVerifyMutation,
    useRequestOTPMutation,
    useFetchuserQuery,
    useUpdateuserMutation,
    useActivateMutation,
    useSignupMutation,
    useLoginMutation,
    useGetSessionQuery,
    useLogoutMutation,
} = injectEndpoints;
