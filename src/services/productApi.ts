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
        bulksyncProducts: builder.mutation({
            query: (body) => ({
                url: '/products/bulk',
                method: 'POST',
                body,
            }),
        }),
        pullupdatedProductsince: builder.query({
            query: (lastSync) => ({ url: `/products/updated-since?since=${lastSync}` }),
        }),
        pullProducts: builder.query({
            query: (lastSync) => ({ url: `/products/updates?since=${lastSync}` }),
        }),
    }),
});

export const {
    useSyncProductMutation,
    useBulksyncProductsMutation,
    usePullupdatedProductsinceQuery,
    usePullProductsQuery,
    useCreateProductMutation
} = injectEndpoints;
