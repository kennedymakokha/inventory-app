import { api } from './index';


export const injectEndpoints = api.injectEndpoints({
    endpoints: builder => ({
        syncInventory: builder.mutation({
            query: (body) => ({
                url: '/inventory/sync',
                method: 'POST',
                body,
            }),
        }),
        pullinventory: builder.query({
            query: (lastSync) => ({ url: `/inventory/updates?since=${lastSync}` }),
        }),
    }),
});

export const {
    usePullinventoryQuery,
    useSyncInventoryMutation
} = injectEndpoints;
