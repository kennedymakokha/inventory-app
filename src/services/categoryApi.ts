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
        bulksyncCategory: builder.mutation({
            query: (body) => ({
                url: '/categories/bulk',
                method: 'POST',
                body,
            }),
        }),
        pullupdatedCategorysince: builder.query({
            query: (lastSync) => ({ url: `/categories/updated-since?since=${lastSync}` }),
        }),
        pullcategories: builder.query({
            query: (lastSync) => ({ url: `/categories/updates?since=${lastSync}` }),
        }),
    }),
});

export const {
    useSyncCategoryMutation,
    useBulksyncCategoryMutation,
    usePullupdatedCategorysinceQuery,
    usePullcategoriesQuery,
    useCreateCategoryMutation
} = injectEndpoints;
