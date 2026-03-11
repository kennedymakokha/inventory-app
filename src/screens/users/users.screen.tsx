import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { getDBConnection } from '../../services/db-service';
import { UserItem } from '../../../models';
import { validateItem } from '../validations/user.validation';
import PageHeader from '../../components/pageHeader';
import { useSearch } from '../../context/searchContext';
import RadialFab from '../../components/multiFab';
import { useSettings } from '../../context/SettingsContext';
import { useSelector } from 'react-redux';
import SwipeableCard from '../../components/SwipeableCard';
import AddUserModal from './components/addModal';
import CSVUploadModal from './components/upload.modal';
import { Theme } from '../../utils/theme';
import { getUsers, saveUserItems, updateUser } from '../../services/users.service';
import EntityModal from '../../components/EntityModal';
import { LayoutAnimation } from 'react-native';

const UsersScreen = () => {
    const { isDarkMode } = useSettings();
    const theme = isDarkMode ? Theme.dark : Theme.light;
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
        business_id: business._id || ""
    };

    const [users, setUsers] = useState<UserItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
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
            console.error(err);
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

        try {
            if (item.user_id) {
                await updateUser(item);

                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setTimeout(() => swipeRefs.current[item.user_id]?.close(), 50);

                setMsg({ msg: "User updated!", state: "success" });
            } else {
                await saveUserItems(item);
                setMsg({ msg: "User added!", state: "success" });
            }

            onRefresh();
            setItem(initialState);
            setModalVisible(false);
        } catch (err: any) {
            setMsg({ msg: err.message || '❌ Could not save user.', state: 'error' });
        }
    };

    const handleDelete = async (user: UserItem) => {
        const db = await getDBConnection();
        await db.executeSql('DELETE FROM users WHERE user_id=?', [user.user_id]);
        setUsers(prev => prev.filter(u => u.user_id !== user.user_id));
    };

    const renderCard = ({ item }: { item: UserItem }) => (
        <SwipeableCard
            uniqueId={item.user_id}
            swipeRefs={swipeRefs}
            currentlyOpenSwipe={currentlyOpenSwipe}
            onEdit={() => { setItem({ ...item }); setModalVisible(true); }}
            onDelete={() => handleDelete(item)}
        >
            <View style={{
                backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 12,
                shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5
            }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{item.name}</Text>
                <View className="flex flex-row items-center justify-between px-2">
                    <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 6 }}>{item.phone_number}</Text>
                    <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 6 }}>{item.role}</Text>
                </View>
            </View>
        </SwipeableCard>
    );

    return (
        <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: 16 }}>
            <PageHeader />
            <FlatList
                data={users.filter(u => u.name.toLowerCase().includes(query.toLowerCase()))}
                keyExtractor={(item) => item.user_id || item.name}
                renderItem={renderCard}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 12 }}
            />

            <AddUserModal
                setMsg={setMsg} isDarkMode={isDarkMode} theme={theme} msg={msg}
                PostLocally={handleSaveUser} modalVisible={modalVisible} setItem={setItem}
                onClose={() => { setModalVisible(false); setItem(initialState); }} item={item}
            />

            <CSVUploadModal
                setMsg={setMsg} msg={msg} isDarkMode={isDarkMode} theme={theme}
                PostLocally={handleSaveUser} modalVisible={uploadModalVisible} setItem={setItem}
                item={item} setModalVisible={setUploadModalVisible}
            />
            <RadialFab
                mainColor={Theme.primary}
                mainIcon="menu"
                radius={120}
                angle={90}
                actions={[
                    { icon: 'add-outline', label: 'Add Category', onPress: () => setModalVisible(true) },
                    { icon: 'cloud-upload-outline', label: 'Upload', onPress: () => setUploadModalVisible(true) },
                    { icon: 'settings-outline', label: 'Settings', onPress: () => console.log('Settings') },
                ]}
            />
        </View>
    );
};

export default UsersScreen;