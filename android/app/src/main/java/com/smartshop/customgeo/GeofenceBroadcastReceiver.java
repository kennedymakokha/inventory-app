package com.smartshop.customgeo;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofencingEvent;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import androidx.core.app.NotificationCompat;
import android.os.Build;
public class GeofenceBroadcastReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        GeofencingEvent geofencingEvent = GeofencingEvent.fromIntent(intent);
        if (geofencingEvent == null || geofencingEvent.hasError()) return;

        int transition = geofencingEvent.getGeofenceTransition();
        
        if (transition == Geofence.GEOFENCE_TRANSITION_ENTER) {
            sendNotification(context, "Welcome to the Shop", "You have automatically checked in.");
        } else if (transition == Geofence.GEOFENCE_TRANSITION_EXIT) {
            sendNotification(context, "Leaving Shop", "You have been checked out.");
        }
       
        if (geofencingEvent == null || geofencingEvent.hasError()) return;

      
        boolean isInside = (transition == Geofence.GEOFENCE_TRANSITION_ENTER || 
                           transition == Geofence.GEOFENCE_TRANSITION_DWELL);

        // Prepare the data for React Native
        WritableMap params = Arguments.createMap();
        params.putBoolean("isInside", isInside);
        params.putString("fenceId", geofencingEvent.getTriggeringGeofences().get(0).getRequestId());

        // Send to React Native
        sendEvent(context, "onGeofenceTransition", params);
    }
    private void sendNotification(Context context, String title, String message) {
        String CHANNEL_ID = "Geofence_Alerts";
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        // 1. Create Channel for Android O+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Shop Alerts", NotificationManager.IMPORTANCE_HIGH);
            notificationManager.createNotificationChannel(channel);
        }

        // 2. Intent to open the app when notification is clicked
        Intent intent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // 3. Build the notification
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_map) // Replace with your app icon
                .setContentTitle(title)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

        notificationManager.notify(101, builder.build());
    }
    private void sendEvent(Context context, String eventName, WritableMap params) {
        // This helper finds the active React instance to deliver the message
        if (context instanceof com.facebook.react.bridge.ReactApplicationContext) {
             ((com.facebook.react.bridge.ReactApplicationContext) context)
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
        }
    }
}