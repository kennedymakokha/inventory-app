import { api } from './index';


export const injectEndpoints = api.injectEndpoints({
    endpoints: builder => ({
        createProduct: builder.mutation({
            query: (body) => ({
                url: '/products',
                method: 'POST',
                body,
            }),
        }),
        syncProduct: builder.mutation({
            query: (body) => ({
                url: '/products/sync',
                method: 'POST',
                body,
            }),
        }),
        bulksync: builder.mutation({
            query: (body) => ({
                url: '/products/bulk',
                method: 'POST',
                body,
            }),
        }),
        pullupdatedsince: builder.query({
            query: (lastSync) => ({ url: `/products/updated-since?since=${lastSync}` }),
        }),
        pullProducts: builder.query({
            query: (lastSync) => ({ url: `/products/updates?since=${lastSync}` }),
        }),
    }),
});

export const {
    useSyncProductMutation,
    useBulksyncMutation,
    usePullupdatedsinceQuery,
    usePullProductsQuery,
    useCreateProductMutation
} = injectEndpoints;
