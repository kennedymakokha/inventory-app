import { api } from './index';


export const injectEndpoints = api.injectEndpoints({
    endpoints: builder => ({
        fetchbusiness: builder.query({
            query: () => `business/my-business`
        }),
        updatebusiness: builder.mutation({
            query: (data) => ({
                url: `business/${data._id}`,
                method: "put",
                body: data
            })
        }),

    }),
});

export const {
    useFetchbusinessQuery,
    useUpdatebusinessMutation
} = injectEndpoints;
