import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, Text, View, Platform, UIManager, LayoutAnimation } from 'react-native';
import { getDBConnection } from '../../services/db-service';
import { UserItem } from '../../../models';
import { validateItem } from '../validations/user.validation';
import PageHeader from '../../components/pageHeader';
import { useSearch } from '../../context/searchContext';
import RadialFab from '../../components/multiFab';

import { useSelector } from 'react-redux';
import SwipeableCard from '../../components/SwipeableCard';
import AddUserModal from './components/addModal';
import CSVUploadModal from './components/upload.modal';

import { getUsers, saveUserItems, updateUser } from '../../services/users.service';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UsersStackParamList } from '../../../models/navigationTypes';
import { useTheme } from '../../context/themeContext';

// Check for New Architecture to prevent LayoutAnimation crashes
const isFabric = (global as any).nativeFabricUIManager != null;
if (Platform.OS === 'android' && !isFabric && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const UsersScreen = () => {
    const { colors, isDarkMode } = useTheme();
    const { query } = useSearch();
    const swipeRefs = useRef<any>({});
    const currentlyOpenSwipe = useRef<any>(null);

    const { user: { business } } = useSelector((state: any) => state.auth);
    
    const initialState: UserItem = {
        name: "",
        user_id: "",
        phone_number: "",
        email: "",
        role: "",
        business_id: business?._id || ""
    };

    type NavigationProp = NativeStackNavigationProp<UsersStackParamList, "Users_Dashboard">;

    const navigation = useNavigation<NavigationProp>();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false); // Added loading state for button
    const [modalVisible, setModalVisible] = useState(false);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [item, setItem] = useState<UserItem>(initialState);
    const [msg, setMsg] = useState({ msg: "", state: "" });

    const loadDataCallback = useCallback(async () => {
        try {
            const db = await getDBConnection();
            const storedItems = await getUsers(db);
            setUsers(storedItems);
        } catch (err) {
            console.error("Failed to load users:", err);
        }
    }, []);

    useEffect(() => { loadDataCallback(); }, [loadDataCallback]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDataCallback();
        setRefreshing(false);
    };

    const handleSaveUser = async () => {
        if (!validateItem(item, setMsg)) return;

        setLoading(true);
        try {
            if (item.user_id) {
                await updateUser(item);
                
                // Only animate if not on New Architecture
                if (!isFabric) {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                }
                
                setTimeout(() => swipeRefs.current[item.user_id]?.close(), 50);
                setMsg({ msg: "User updated!", state: "success" });
            } else {
                await saveUserItems(item);
                setMsg({ msg: "User added!", state: "success" });
            }

            await loadDataCallback(); // Refresh list
            
            // Delay closing slightly so user sees the success toast if inside modal
            setTimeout(() => {
                setModalVisible(false);
                setItem(initialState);
            }, 500);

        } catch (err: any) {
            setMsg({ msg: err.message || ' Could not save user.', state: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (user: UserItem) => {
        try {
            const db = await getDBConnection();
            await db.executeSql('DELETE FROM User WHERE user_id=?', [user.user_id]);
            setUsers(prev => prev.filter(u => u.user_id !== user.user_id));
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const renderCard = ({ item }: { item: UserItem }) => (
        <SwipeableCard
            uniqueId={item.user_id}
            swipeRefs={swipeRefs}
            currentlyOpenSwipe={currentlyOpenSwipe}
            onEdit={() => { 
                setItem({ ...item }); 
                setModalVisible(true); 
            }}
            onDelete={() => handleDelete(item)}
            onPress={() => navigation.navigate("User_Dashboard", { user: item })}
        >
            <View style={{
                backgroundColor: colors.card, 
                padding: 16, 
                borderRadius: 12, // More rounded for modern look
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: "#000", 
                shadowOffset: { width: 0, height: 2 }, 
                shadowOpacity: 0.1, 
                shadowRadius: 4, 
                elevation: 3
            }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={{ color: colors.subText, fontSize: 13 }}>{item.phone_number}</Text>
                    <View style={{ 
                        backgroundColor: colors.primary + '15', 
                        paddingHorizontal: 10, 
                        paddingVertical: 4, 
                        borderRadius: 20 
                    }}>
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {item.role || 'No Role'}
                        </Text>
                    </View>
                </View>
            </View>
        </SwipeableCard>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <PageHeader />
            
            <FlatList
                data={users.filter(u => u.name.toLowerCase().includes(query.toLowerCase()))}
                keyExtractor={(item) => item.user_id?.toString() || item.name}
                renderItem={renderCard}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 12 }}
                ListEmptyComponent={() => (
                    <View style={{ alignItems: 'center', marginTop: 50 }}>
                        <Text style={{ color: colors.subText }}>No users found</Text>
                    </View>
                )}
            />

            <AddUserModal
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
                item={item}
                setItem={setItem}
                PostLocally={handleSaveUser}
                onClose={() => { 
                    setModalVisible(false); 
                    setMsg({ msg: "", state: "" });
                    setItem(initialState); 
                }}
                loading={loading}
                msg={msg}
                setMsg={setMsg}
                isDarkMode={isDarkMode}
            />

            <CSVUploadModal
                modalVisible={uploadModalVisible}
                setModalVisible={setUploadModalVisible}
                item={item}
                setItem={setItem}
                PostLocally={handleSaveUser}
                msg={msg}
                setMsg={setMsg}
                isDarkMode={isDarkMode}
                theme={colors}
            />

            <RadialFab
                mainColor={colors.primary}
                mainIcon="menu"
                radius={120}
                angle={90}
                actions={[
                    { icon: 'person-add-outline', label: 'Add User', onPress: () => setModalVisible(true) },
                    { icon: 'cloud-upload-outline', label: 'Upload CSV', onPress: () => setUploadModalVisible(true) },
                    { icon: 'settings-outline', label: 'Settings', onPress: () => console.log('Settings') },
                ]}
            />
        </View>
    );
};

export default UsersScreen;