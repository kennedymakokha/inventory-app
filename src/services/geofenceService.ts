import BackgroundGeolocation, {
    GeofenceEvent,
    Config
} from "react-native-background-geolocation";

export const initGeofence = async (): Promise<void> => {
    const config: Config = {
        desiredAccuracy: BackgroundGeolocation.DesiredAccuracy.High,
        distanceFilter: 50,
        stopOnTerminate: false,
        startOnBoot: true,
        geofenceModeHighAccuracy: true
    };

    await BackgroundGeolocation.ready(config);
};

export const registerBusinessGeofence = async (
    latitude: number,
    longitude: number
) => {

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng)) {
        console.log("Invalid geofence coordinates", latitude, longitude);
        return;
    }

    await BackgroundGeolocation.addGeofence({
        identifier: "business-zone",
        radius: 200,
        latitude: lat,
        longitude: lng,
        notifyOnExit: true,
        notifyOnEntry: false
    });
};
export const listenForGeofence = (onExit: () => void): void => {
    BackgroundGeolocation.onGeofence((event: GeofenceEvent) => {
        console.log("Geofence event:", event);
        if (event.action === "EXIT") {
            onExit();
        }
    });
};

export const startGeofenceMonitoring = async (): Promise<void> => {
    await BackgroundGeolocation.startGeofences();
};
