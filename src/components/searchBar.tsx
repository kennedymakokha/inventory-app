import React, { useEffect, useRef } from 'react';
import { TextInput, View } from 'react-native';
import { useSearch } from '../context/searchContext';

type Props = {
    placeholder?: string;
    loading?: boolean
    white?: boolean
};

const SearchBar: React.FC<Props> = ({ placeholder = 'Search...', loading, white }) => {
    const { query, setQuery } = useSearch();
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        // Blurs the input shortly after mount
        const timeout = setTimeout(() => {
            inputRef.current?.blur();
        }, 100);
        return () => clearTimeout(timeout);
    }, []);

    return (

        <>
            {loading ? <View className="bg-secondary-700   p-2 h-10 rounded-md animate-pulse " /> :

                <View className={`w-full ${white ? "bg-slate-50 rounded-md" : "border border-green-400"} rounded-md px-2`}>
                    <TextInput
                        ref={inputRef}
                        value={query}
                        onChangeText={setQuery}
                        autoFocus={false}
                        placeholder={placeholder}
                        className={`w-full px-3 py-2 h-10 text-end ${white ? "text-green-400" : "text-primary-900 "}rounded-md   `}
                        placeholderTextColor={white ? "black" : "#ffceff"}
                    />
                </View>
            }
        </>

    );
};

export default SearchBar;
