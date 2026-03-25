package com.smartshop.customgeo;
import android.app.PendingIntent;
import android.os.Build;

import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofencingRequest;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.net.Uri;
import android.provider.Settings;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.location.GeofencingClient;
import com.google.android.gms.location.LocationServices;
import android.text.TextUtils;
import android.util.Log;
public class RNCustomGeolocationModule extends ReactContextBaseJavaModule {

    private final LocationManager locationManager;
    private final GeofencingClient geofencingClient;
    private PendingIntent geofencePendingIntent;

    private PendingIntent getGeofencePendingIntent() {
        if (geofencePendingIntent != null) {
            return geofencePendingIntent;
        }
        Intent intent = new Intent(context, GeofenceBroadcastReceiver.class);
        // Use FLAG_UPDATE_CURRENT and FLAG_MUTABLE
        geofencePendingIntent = PendingIntent.getBroadcast(
            context, 
            0, 
            intent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
        );
        return geofencePendingIntent;
    }
    private final ReactApplicationContext context;

    public RNCustomGeolocationModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.context = reactContext;
        this.locationManager = (LocationManager) reactContext.getSystemService(Context.LOCATION_SERVICE);
        this.geofencingClient = LocationServices.getGeofencingClient(reactContext);
    }

    @Override
    @NonNull
    public String getName() {
        return "RNCustomGeolocation";
    }

    @ReactMethod
    public void getCurrentPosition(int timeout, Promise promise) {
        // Use Looper.getMainLooper() to ensure Handler works correctly
        Handler handler = new Handler(Looper.getMainLooper());
        Runnable runnable = () -> promise.reject("TIMEOUT", "Location request timed out");

        handler.postDelayed(runnable, timeout);

        try {
            // Try GPS first, fallback to Network
            Location location = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (location == null) {
                location = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            }

            if (location != null) {
                handler.removeCallbacks(runnable);
                promise.resolve(mapLocation(location));
            } else {
                // If no last known location, request a single update (Optional implementation)
                promise.reject("NO_LOCATION", "Could not retrieve last known location");
            }
        } catch (SecurityException e) {
            promise.reject("PERMISSION_DENIED", "Location permission not granted", e);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
    @ReactMethod
    public void addGeofence(String id, double lat, double lng, float radius) {
        Geofence geofence = new Geofence.Builder()
                .setRequestId(id)
                .setCircularRegion(lat, lng, radius)
                .setExpirationDuration(Geofence.NEVER_EXPIRE)
                .setTransitionTypes(Geofence.GEOFENCE_TRANSITION_ENTER | Geofence.GEOFENCE_TRANSITION_EXIT)
                .build();

        GeofencingRequest request = new GeofencingRequest.Builder()
                .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER)
                .addGeofence(geofence)
                .build();

        try {
          
            geofencingClient.addGeofences(request, getGeofencePendingIntent())
        .addOnSuccessListener(aVoid -> {
            Log.d("GEO", "Geofence Added Successfully!");
        })
        .addOnFailureListener(e -> {
            Log.e("GEO", "Failed to add geofence: " + e.getMessage());
        });
        } catch (SecurityException e) {
            e.printStackTrace();
        }
    }
    @ReactMethod
    public void requestIgnoreBatteryOptimizations() {
        String packageName = context.getPackageName();
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        
        if (pm != null && !pm.isIgnoringBatteryOptimizations(packageName)) {
            Intent intent = new Intent();
            intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            intent.setData(Uri.parse("package:" + packageName));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        }
    } 

        // Required for NativeEventEmitter
    @ReactMethod
    public void addListener(String eventName) {
        // Keep: Required for RN built-in Event Emitter
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Keep: Required for RN built-in Event Emitter
    }
    @ReactMethod
    public void checkLocationSettings(Promise promise) {
        Context context = getReactApplicationContext();
        boolean gpsEnabled = false;
        boolean networkEnabled = false;

        try {
            gpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
            networkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
        } catch (Exception ex) {
            // Handle potential security exceptions
        }

        WritableMap settings = Arguments.createMap();
        settings.putBoolean("gpsEnabled", gpsEnabled);
        settings.putBoolean("networkEnabled", networkEnabled);
        settings.putBoolean("isLocationReady", gpsEnabled || networkEnabled);

        promise.resolve(settings);
    }

    @ReactMethod
    public void openLocationSettings() {
        Intent intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getReactApplicationContext().startActivity(intent);
    }
    @ReactMethod
    public void getBatteryOptimizationStatus(Promise promise) {
        String packageName = context.getPackageName();
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        
        // Just return true/false so JS can decide whether to show a "Warning" banner
        if (pm != null) {
            promise.resolve(pm.isIgnoringBatteryOptimizations(packageName));
        } else {
            promise.resolve(true);
        }
    }
    @ReactMethod
    public void startWatching(ReadableMap options) {
        // 1. Handling Accuracy Modes
        String accuracy = options.hasKey("accuracy") ? options.getString("accuracy") : "balanced";
        String provider = LocationManager.GPS_PROVIDER;
        
        if ("balanced".equals(accuracy)) {
            provider = LocationManager.NETWORK_PROVIDER;
        }

        // 2. Handling Distance Filters & Intervals
        float distanceFilter = options.hasKey("distanceFilter") ? (float) options.getDouble("distanceFilter") : 10;
        int interval = options.hasKey("interval") ? options.getInt("interval") : 5000;

        try {
            locationManager.requestLocationUpdates(
                provider, 
                interval, 
                distanceFilter, 
                locationListener
            );
        } catch (SecurityException e) {
            // Log or emit error to JS
        }
    }
    @ReactMethod
    public void startBackgroundService() {
        Intent serviceIntent = new Intent(context, LocationService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }

    @ReactMethod
    public void stopBackgroundService() {
        Intent serviceIntent = new Intent(context, LocationService.class);
        context.stopService(serviceIntent);
    }
    @ReactMethod
    public void stopWatching() {
        locationManager.removeUpdates(locationListener);
    }

    // --- Helper Methods ---

    private WritableMap mapLocation(Location location) {
        WritableMap map = Arguments.createMap();
        map.putDouble("latitude", location.getLatitude());
        map.putDouble("longitude", location.getLongitude());
        map.putDouble("accuracy", location.getAccuracy());
        map.putDouble("altitude", location.getAltitude());
        map.putDouble("timestamp", location.getTime());
        return map;
    }

    private final LocationListener locationListener = new LocationListener() {
        @Override
        public void onLocationChanged(@NonNull Location location) {
            sendEvent("onLocationUpdate", mapLocation(location));
        }

        @Override public void onProviderEnabled(@NonNull String provider) {}
        @Override public void onProviderDisabled(@NonNull String provider) {}
    };

    private void sendEvent(String eventName, WritableMap params) {
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
               .emit(eventName, params);
    }
}