import { api } from './index';


export const injectEndpoints = api.injectEndpoints({
    endpoints: builder => ({
        createCategory: builder.mutation({
            query: (body) => ({
                url: '/categories',
                method: 'POST',
                body,
            }),
        }),
        syncCategory: builder.mutation({
            query: (body) => ({
                url: '/categories/sync',
                method: 'POST',
                body,
            }),
        }),
        bulksync: builder.mutation({
            query: (body) => ({
                url: '/categories/bulk',
                method: 'POST',
                body,
            }),
        }),
        pullupdatedsince: builder.query({
            query: (lastSync) => ({ url: `/categories/updated-since?since=${lastSync}` }),
        }),
        pullcategories: builder.query({
            query: (lastSync) => ({ url: `/categories/updates?since=${lastSync}` }),
        }),
    }),
});

export const {
    useSyncCategoryMutation,
    useBulksyncMutation,
    usePullupdatedsinceQuery,
    usePullcategoriesQuery,
    useCreateCategoryMutation
} = injectEndpoints;
