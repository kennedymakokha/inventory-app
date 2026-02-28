import { createDrawerNavigator } from '@react-navigation/drawer';
import { RootStack } from './rootStack';
import CustomDrawer from './custormDrawer';

const Drawer = createDrawerNavigator();

export function RootDrawer() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawer {...props} />}
            screenOptions={{headerShown: false}}>
            <Drawer.Screen name="Home" component={RootStack} />
            {/* <Drawer.Screen name="Profile" component={ProfileScreen} /> */}
        </Drawer.Navigator>
    );
}