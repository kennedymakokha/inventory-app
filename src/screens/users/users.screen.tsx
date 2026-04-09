import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, Text, View, Platform, UIManager, LayoutAnimation, TouchableOpacity, StyleSheet } from 'react-native';
import { getDBConnection } from '../../services/db-service';
import { UserItem } from '../../../models';
import { validateItem } from '../validations/user.validation';
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
import Ionicons from 'react-native-vector-icons/Ionicons';

const isFabric = (globalThis as any).nativeFabricUIManager != null;
if (Platform.OS === 'android' && !isFabric && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const UsersScreen = () => {
    const { colors, isDarkMode } = useTheme();
    const { query } = useSearch();
    const navigation = useNavigation<NativeStackNavigationProp<UsersStackParamList, "Users_Dashboard">>();
    const swipeRefs = useRef<any>({});
    const currentlyOpenSwipe = useRef<any>(null);
    const { user: { business } } = useSelector((state: any) => state.auth);
    const initialState: UserItem = {
        name: "", user_id: "", phone_number: "", email: "", role: "",
        business_id: business?._id || ""
    };
    const [users, setUsers] = useState<UserItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
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
                if (!isFabric) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setTimeout(() => swipeRefs.current[item.user_id]?.close(), 50);
                setMsg({ msg: "User updated!", state: "success" });
            } else {
                await saveUserItems(item);
                setMsg({ msg: "User added!", state: "success" });
            }
            await loadDataCallback();
            setTimeout(() => {
                setModalVisible(false);
                setItem(initialState);
            }, 500);
        } catch (err: any) {
            setMsg({ msg: err.message || ' Could not save user.', state: 'error' });
        } finally { setLoading(false); }
    };
    const handleDelete = async (user: UserItem) => {
        try {
            const db = await getDBConnection();
            await db.executeSql('DELETE FROM User WHERE user_id=?', [user.user_id]);
            setUsers(prev => prev.filter(u => u.user_id !== user.user_id));
        } catch (err) { console.error("Delete failed:", err); }
    };

    const renderCard = ({ item }: { item: UserItem }) => (
        <SwipeableCard
            uniqueId={item.user_id}
            swipeRefs={swipeRefs}
            currentlyOpenSwipe={currentlyOpenSwipe}
            onEdit={() => { setItem({ ...item }); setModalVisible(true); }}
            onDelete={() => handleDelete(item)}
            onPress={() => navigation.navigate("User_Dashboard", { user: item })}
        >
            <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                            {item.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
                        <Text style={{ color: colors.subText, fontSize: 12 }}>{item.phone_number}</Text>
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}>
                        <Text style={[styles.roleText, { color: colors.primary }]}>{item.role || 'Staff'}</Text>
                    </View>
                </View>
            </View>
        </SwipeableCard>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
         

            {/* 3. MAIN LIST */}
            <FlatList
                data={users.filter(u => u.name.toLowerCase().includes(query.toLowerCase()))}
                keyExtractor={(item) => item.user_id?.toString() || item.name}
                renderItem={renderCard}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                contentContainerStyle={styles.listPadding}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={50} color={colors.border} />
                        <Text style={{ color: colors.subText, marginTop: 10 }}>No users found</Text>
                    </View>
                )}
            />

            {/* MODALS */}
            <AddUserModal 
                modalVisible={modalVisible} setModalVisible={setModalVisible} 
                item={item} setItem={setItem} PostLocally={handleSaveUser} 
                onClose={() => { setModalVisible(false); setMsg({ msg: "", state: "" }); setItem(initialState); }}
                loading={loading} msg={msg} setMsg={setMsg} isDarkMode={isDarkMode}
            />
            <CSVUploadModal 
                modalVisible={uploadModalVisible} setModalVisible={setUploadModalVisible}
                item={item} setItem={setItem} PostLocally={handleSaveUser}
                msg={msg} setMsg={setMsg} isDarkMode={isDarkMode} theme={colors}
            />

            {/* RADIAL FAB */}
            <RadialFab
                mainColor={colors.primary}
                mainIcon="add"
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

const styles = StyleSheet.create({
  

    mainTitle: {
        fontSize: 16,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    miniIndicator: {
        width: 20,
        height: 3,
        borderRadius: 2,
        marginTop: 4
    },
    listPadding: {
        paddingTop: 110,
        paddingHorizontal: 16,
        paddingBottom: 120
    },
    userCard: {
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 45,
        height: 45,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
    },
    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    roleText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
        opacity: 0.5
    }
});

export default UsersScreen;