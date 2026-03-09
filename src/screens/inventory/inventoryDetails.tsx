import { View, Text, ActivityIndicator } from 'react-native'
import React, { useCallback, useEffect, useState, useMemo } from 'react'

import { getDBConnection } from '../../services/db-service'
import PageHeader from '../../components/pageHeader'
import SalesReportTable from '../reports/components/salesTable'
import { FormatDate } from '../../../utils/formatDate'
import { getInventory, getInventoryLogs } from '../../services/inventory.service'

const PAGE_SIZE = 20

const InventoryDetails: React.FC = ({ route, navigation }: any) => {
    const { product } = route.params

    const [data, setData] = useState<any[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    const headers = [
        { key: 'createdAt', label: 'Date' },
        { key: 'reference_type', label: 'Type' },
        { key: 'quantity', label: 'Quantity Stocked' }
    ]
    const loadInitialData = useCallback(async () => {
        try {
            setLoading(true)

            const db = await getDBConnection()

            const logs = await getInventoryLogs(
                db,
                product.product_id,
                1,
                PAGE_SIZE
            )
            setData(logs)
            setPage(1)
            setHasMore(logs.length === PAGE_SIZE)

        } catch (error) {
            console.error('Initial inventory load error:', error)
        } finally {
            setLoading(false)
        }
    }, [product.product_id])
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return

        try {
            setLoadingMore(true)

            const db = await getDBConnection()

            const nextPage = page + 1
            const offset = page * PAGE_SIZE

            const logs = await getInventoryLogs(
                db,
                product.product_id,
                PAGE_SIZE,
                offset
            )

            if (logs.length > 0) {
                setData(prev => [...prev, ...logs])
                setPage(nextPage)
            }

            if (logs.length < PAGE_SIZE) {
                setHasMore(false)
            }

        } catch (error) {
            console.error('Load more inventory error:', error)
        } finally {
            setLoadingMore(false)
        }
    }, [loadingMore, hasMore, page, product.product_id])

    useEffect(() => {
        loadInitialData()
    }, [loadInitialData])

    const tableData = useMemo(() => {
        return data.map(({ createdAt, reference_type, quantity }) => ({
            createdAt: FormatDate(createdAt),
            reference_type,
            quantity
        }))
    }, [data])

    const FooterLoader = () => {
        if (!loadingMore) return null

        return (
            <View className="py-4">
                <ActivityIndicator size="small" color="#4ade80" />
            </View>
        )
    }

    const EmptyState = () => {
        if (loading) return null

        if (data.length === 0) {
            return (
                <Text className="text-slate-400 text-center mt-10">
                    No inventory history found
                </Text>
            )
        }

        return null
    }

    return (
        <View className="bg-slate-900 flex-1">

            <PageHeader
                component={() => (
                    <View className="flex-row justify-center py-3">
                        <Text className="text-xl font-bold text-green-300">
                            Inventory History
                        </Text>
                    </View>
                )}
            />

            <Text className="text-lg font-bold text-slate-100 uppercase text-center my-2">
                {product.product_name} Stocking History
            </Text>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#4ade80" />
                </View>
            ) : (
                <>
                    <EmptyState />

                    <SalesReportTable
                        headers={[
                            { key: "createdAt", label: "Date", width: 180 },
                            { key: "reference_type", label: "Type" },
                            { key: "quantity", label: "Quantity Stocked" },
                        ]}
                        data={tableData}
                        onEndReached={loadMore}
                        loading={loadingMore}
                        
                        rowKey={(item) => `${item.product_id}_${item.createdAt}`}
                    />
                </>
            )}

        </View>
    )
}

export default InventoryDetails