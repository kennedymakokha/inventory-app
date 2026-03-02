import { api } from './index';


export const injectEndpoints = api.injectEndpoints({
    endpoints: builder => ({
          createSale: builder.mutation({
            query: (body) => ({
                url: '/sales',
                method: 'POST',
                body,
            }),
        }),
        syncSales: builder.mutation({
            query: (body) => ({
                url: '/sales/sync',
                method: 'POST',
                body,
            }),
        }),
        pullSales: builder.query({
            query: (lastSync) => ({ url: `/sales/updates?since=${lastSync}` }),
        }),
    }),
});

export const {
    usePullSalesQuery,
    useSyncSalesMutation,
    useCreateSaleMutation,
} = injectEndpoints;
