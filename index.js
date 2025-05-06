// /**
//  * @format
//  */

// import {AppRegistry} from 'react-native';
// import App from './App';
// import {name as appName} from './app.json';

// AppRegistry.registerComponent(appName, () => App);


/**
 * @format
 */
import './gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { MenuProvider } from 'react-native-popup-menu';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/authContext';
import { SearchProvider } from './src/context/searchContext';

const Root = () => (
    <NavigationContainer>
        <AuthProvider>
            <SearchProvider>
                <MenuProvider>
                    <App />
                </MenuProvider>
            </SearchProvider>
        </AuthProvider>
    </NavigationContainer>
);
AppRegistry.registerComponent(appName, () => Root);
