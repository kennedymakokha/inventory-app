import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    FlatList,
    Dimensions,
    StyleSheet,
} from 'react-native';


type Option = {
    label: string;
    value: string | number;
};

type Props = {
    label?: string;
    options: Option[];
    value: string | number | null;
    onChange: any;
    valuExists?: any
};

const SCREEN_WIDTH = Dimensions.get('window').width;

const SelectInput: React.FC<Props> = ({ label, options, value, onChange, valuExists }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const selectedLabel = options.find((opt) => opt.value === value)?.label || 'Select';

    const filtered = options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            {valuExists ? <View className="flex bg-secondary-300 h-14 justify-center  rounded-lg p-3 mb-2 w-full">
                <Text className='font-bold capitalize text-[#aaa]]'>{valuExists}</Text>
            </View> : <View className="mb-4 z-10">

                {label && <Text className="text-sm text-gray-500 mb-1">{label}</Text>}

                <TouchableOpacity
                    activeOpacity={1}
                    className="flex w-full  h-14   bg-primary-50   
        flex-row items-center justify-between border border-gray-300 rounded-lg px-4 py-3 "
                    onPress={() => setOpen((prev) => !prev)}
                >
                    <Text className="text-base text-gray-800">{selectedLabel}</Text>
                    {/* <ChevronDown size={18} color="#888" /> */}
                </TouchableOpacity>

                {open && (
                    <View style={styles.dropdownContainer} className="absolute top-16 bg-white w-full rounded-lg shadow-lg border border-gray-100 z-50">
                        <TextInput
                            placeholder="Type to filter..."
                            value={search}
                            onChangeText={setSearch}
                            className="px-4 py-2 text-lg border-b h-20 border-gray-200 text-gray-700"
                        />
                        <FlatList
                            data={filtered}
                            keyExtractor={(item) => item.value.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    activeOpacity={1}
                                    className="px-4 py-3 border-b border-gray-100"
                                    onPress={() => {
                                        onChange(item.value);
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <Text className="text-base text-lg text-gray-800">{item.label}</Text>
                                </TouchableOpacity>
                            )}
                            style={{ maxHeight: 200 }}
                        />
                    </View>
                )}
            </View>}
        </>
    );
};
const styles = StyleSheet.create({
    dropdownContainer: {
        width: SCREEN_WIDTH - 32, // full width minus padding (assuming 16px)
        left: 0,
        right: 0,
    },
});

export default SelectInput;
