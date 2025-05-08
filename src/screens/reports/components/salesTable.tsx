import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
const SCREEN_WIDTH = Dimensions.get('window').width;
const SalesReportTable = ({ headers, data }: { headers: { label: string, key: string }[], data: Record<string, any>[] }) => {
  return (
    <ScrollView  horizontal className="w-full">
      <View>
        {/* Header */}
        <View className="flex-row bg-gray-200">
          {headers.map((header, index) => (
            <View key={index} className="p-3 border border-gray-300 w-[14.2857142857%]">
              <Text className="font-bold">{header.label}</Text>
            </View>
          ))}
        </View>

        {/* Rows */}
        {data.map((row, rowIndex) => (
          <View key={rowIndex} className={`flex-row w-full ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-green-50'}`}>
            {headers.map((header, cellIndex) => (
              <View key={cellIndex} className={`p-3 border border-gray-200 w-[14.2857142857%] border-slate-200 `}>
                <Text numberOfLines={1} ellipsizeMode="tail">{row[header.key]}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>

  );
};

export default SalesReportTable;
{/* <ScrollView horizontal className="w-full">
<View>
  {/* Table Headers */}
// <View className="flex-row bg-gray-200">
//   {headers.map((header, i) => (
//     <View key={i} className="p-3 border border-gray-300 w-[150px]">
//       <Text className="font-bold text-xs">{header}</Text>
//     </View>
//   ))}
// </View>

{/* Table Rows */ }
//   {data.map((row, rowIndex) => (
//     <View key={rowIndex} className={`flex-row ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-green-50'}`}>
//       {headers.map((key, cellIndex) => (
//         <View key={cellIndex} className={`p-3 border border-gray-200 w-[150px] ${row[key].synced === 1 ? "border-green-200" : "border-gray-200"}  `}>
//           <Text className="text-xs" numberOfLines={1}>
//             {row[key.toLowerCase()] ?? '--'}
//           </Text>
//         </View>
//       ))}
//     </View>
//   ))}
// </View>
// </ScrollView> */}