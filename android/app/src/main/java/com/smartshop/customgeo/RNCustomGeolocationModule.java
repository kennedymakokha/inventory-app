package com.smartshop.customgeo;

import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.content.Context;

import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class RNCustomGeolocationModule extends ReactContextBaseJavaModule {

    private LocationManager locationManager;

    public RNCustomGeolocationModule(ReactApplicationContext reactContext) {
        super(reactContext);
        locationManager = (LocationManager) reactContext.getSystemService(Context.LOCATION_SERVICE);
    }

    @Override
    public String getName() {
        return "RNCustomGeolocation";
    }

    @ReactMethod
    public void getCurrentPosition(Promise promise) {
        try {
            Location location = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);

            WritableMap map = Arguments.createMap();
            map.putDouble("latitude", location.getLatitude());
            map.putDouble("longitude", location.getLongitude());
            map.putDouble("accuracy", location.getAccuracy());

            promise.resolve(map);
        } catch (Exception e) {
            promise.reject("ERROR", e);
        }
    }

    @ReactMethod
    public void startWatching() {
        locationManager.requestLocationUpdates(
            LocationManager.GPS_PROVIDER,
            2000,
            1,
            locationListener
        );
    }

    @ReactMethod
    public void stopWatching() {
        locationManager.removeUpdates(locationListener);
    }

    private final LocationListener locationListener = new LocationListener() {
        @Override
        public void onLocationChanged(Location location) {
            WritableMap map = Arguments.createMap();
            map.putDouble("latitude", location.getLatitude());
            map.putDouble("longitude", location.getLongitude());
            map.putDouble("accuracy", location.getAccuracy());

            sendEvent("onLocationUpdate", map);
        }
    };

    private void sendEvent(String eventName, WritableMap params) {
        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
}