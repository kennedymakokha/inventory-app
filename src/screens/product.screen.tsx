

import React, { useCallback, useEffect, useState } from 'react';
import {
    Button,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from 'react-native';

import { getDBConnection, getTodoItems, saveTodoItems, createTable, deleteTodoItem } from '../services/db-service';
import { ProductItem, ToDoItem } from '../../models';
import { ToDoItemComponent } from '../components/ToDoItem';
import { createProductTable, getProducts, getUnsyncedProducts, saveProductItems } from '../services/product.service';
import { ProductItemConainer } from '../components/ProductItem';


const ProductScreen = () => {
    const isDarkMode = useColorScheme() === 'dark';
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [newProduct, setNewProduct] = useState('');
    const [item, setItem] = useState({
        product_name: "",
        price: "",
        description: "",
    })
    const loadDataCallback = useCallback(async () => {
        try {
            const initTodos: any = [];
            const db = await getDBConnection();
            await createProductTable(db);
            const storedItems = await getUnsyncedProducts(db);

            if (storedItems.length > 0) {

                setProducts(storedItems);
            } else {
                // await saveProductItems(db, initTodos);
                // setProducts(initTodos);
            }
        } catch (error) {
            console.error(error);
        }
    }, []);
    useEffect(() => {
        loadDataCallback();
    }, [loadDataCallback]);
    const addTodo = async () => {
        // if (!newProduct.trim()) return;
        try {

            setProducts([...products, { product_name: newProduct, price: '', description: '' }]);
            const db = await getDBConnection();
            let storedItems = await saveProductItems(db, item);
            console.log(storedItems)
            setProducts(storedItems);
            setNewProduct('');
            console.log("done")
        } catch (error) {
            console.error(error);
        }
    };

    // const deleteItem = async (id: number) => {
    //     try {
    //         const db = await getDBConnection();
    //         await deleteTodoItem(db, id);
    //         todos.splice(id, 1);
    //         setTodos(todos.slice(0));
    //     } catch (error) {
    //         console.error(error);
    //     }
    // };
    return (
        <SafeAreaView>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic">
                <View style={[styles.appTitleView]}>
                    <Text style={styles.appTitleText}> ToDo Application </Text>
                </View>
                <View>
                    {products.map((product) => (
                        <ProductItemConainer key={product._id} item={product} />
                    ))}
                </View>
                <View style={styles.textInputContainer}>
                    <TextInput style={styles.textInput} value={item.product_name} onChangeText={text => setItem(prev => ({ ...prev, product_name: text }))} />
                    <TextInput style={styles.textInput} value={item.price} onChangeText={text => setItem(prev => ({ ...prev, price: text }))} />
                    <TextInput style={styles.textInput} value={item.description} onChangeText={text => setItem(prev => ({ ...prev, description: text }))} />
                    <Button
                        onPress={() => addTodo()}
                        title="Add ToDo"
                        color="#841584"
                        accessibilityLabel="add todo item"
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};
const styles = StyleSheet.create({
    appTitleView: {
        marginTop: 20,
        justifyContent: 'center',
        flexDirection: 'row',
    },
    appTitleText: {
        fontSize: 24,
        fontWeight: '800'
    },
    textInputContainer: {
        marginTop: 30,
        marginLeft: 20,
        marginRight: 20,
        borderRadius: 10,
        borderColor: 'black',
        borderWidth: 1,
        justifyContent: 'flex-end'
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 5,
        height: 60,
        margin: 10,
        backgroundColor: 'pink'
    },
});
export default ProductScreen;
