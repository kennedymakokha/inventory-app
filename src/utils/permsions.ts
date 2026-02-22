import { PermissionsAndroid, Platform } from 'react-native';

export const requestBluetoothPermissions = async () => {
    if (Platform.OS !== 'android') return true;

    try {
        const apiLevel = parseInt(Platform.Version.toString(), 10);

        if (apiLevel < 31) {
            // Android 11 or lower needs Location
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
            // Android 12+ needs Connect and Scan
            const result = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]);

            return (
                result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
                result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED
            );
        }
    } catch (err) {
        console.warn(err);
        return false;
    }
};