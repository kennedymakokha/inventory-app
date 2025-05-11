import { api } from './index';


export const injectEndpoints = api.injectEndpoints({
    endpoints: builder => ({
        syncProduct: builder.mutation({
            query: (body) => ({
                url: '/products/sync',
                method: 'POST',
                body,
            }),
        }),
        pullProducts: builder.query({
            query: (lastSync) => ({ url: `/products/updates?since=${lastSync}` }),
        }),
    }),
});

export const {
    useSyncProductMutation,
    usePullProductsQuery
} = injectEndpoints;
