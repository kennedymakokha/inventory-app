import { View, Text } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { createInventoryTable, getInventoriesByProductId } from '../../services/inventory.service';
import { getDBConnection } from '../../services/db-service';
import PageHeader from '../../components/pageHeader';
import SalesReportTable from '../reports/components/salesTable';
import { FormatDate, getDaysBetween, getDurationFromNow } from '../../../utils/formatDate';

const InventoryDetails: React.FC = ({ route, navigation }: any) => {
    const { product } = route.params;
    const [data, setData] = useState([])
    const headers =

        [{ key: 'created_at', label: 'Date' },
        { key: 'quantity', label: 'quantity stocked' },
        { key: 'expiryDate', label: 'expires in' }]
    const loadDataCallback = useCallback(async () => {
        try {
            const db = await getDBConnection();
            await createInventoryTable(db);
            let storedItems: any = await getInventoriesByProductId(product.product_id, db);

            setData(storedItems)

        } catch (error) {
            console.error(error);
        }
    }, []);
    useEffect(() => {
        loadDataCallback()
    }, [])
 

    let filData = data !== undefined ? data : []

    return (
        <View className='bg-slate-900  flex-1'>
            <PageHeader component={() => {
                return (
                    <View className="flex-row justify-around  gap-x-1 py-3 ">
                        <Text className='text-xl font-bold text-green-300 '>Last Stocked in </Text>
                        <Text className='text-xl font-bold text-green-300 '> </Text>
                    </View>
                )
            }} />
            <Text className="text-lg font-bold text-slate-100 uppercase text-center my-2">{product.product_name} stocking   History</Text>
            <SalesReportTable headers={headers} data={filData.map(({ created_at, quantity, expiryDate }) => ({ created_at: FormatDate(created_at), quantity, expiryDate:getDaysBetween(expiryDate) }))} />
        </View>
    )
}

export default InventoryDetails