import React from 'react';
import { TextInput, View } from 'react-native';
import { useSearch } from '../context/searchContext';

type Props = {
    placeholder?: string;
    loading?: boolean
};

const SearchBar: React.FC<Props> = ({ placeholder = 'Search...', loading }) => {
    const { query, setQuery } = useSearch();
    return (
        <>
            {loading ? <View className="bg-secondary-700   p-2 h-10 rounded-md animate-pulse "/> :

                <View className="w-full border border-primary-600 px-2">
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 h-10 text-end text-primary-100 rounded-md text-black"
                        placeholderTextColor="#ffceff"
                    />
                </View>
            }
        </>

    );
};

export default SearchBar;
