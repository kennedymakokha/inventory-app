package com.smartshop.kiosk;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent; // Added missing import

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class KioskModule extends ReactContextBaseJavaModule {

    private ReactApplicationContext reactContext;

    public KioskModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return "Kiosk";
    }

    private DevicePolicyManager getDPM() {
        return (DevicePolicyManager) reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE);
    }

    private ComponentName getAdminComponent() {
        return new ComponentName(reactContext, MyDeviceAdminReceiver.class);
    }

    @ReactMethod
    public void lock() {
        DevicePolicyManager dpm = getDPM();
        ComponentName adminName = getAdminComponent();

        if (!dpm.isDeviceOwnerApp(reactContext.getPackageName())) {
            return;
        }

        // Configure Kiosk restrictions
        dpm.setKeyguardDisabled(adminName, true); // disable lock screen
        dpm.setStatusBarDisabled(adminName, false); // keep status bar visible (set to true to hide)

        dpm.setLockTaskPackages(
            adminName,
            new String[]{reactContext.getPackageName()}
        );

        Activity activity = getCurrentActivity();

        if (activity != null) {
            activity.runOnUiThread(() -> {
                try {
                    activity.startLockTask();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        } else {
            // Fallback: bring app to foreground
            Intent intent = reactContext.getPackageManager()
                .getLaunchIntentForPackage(reactContext.getPackageName());

            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(intent);
            }
        }
    }

    @ReactMethod
    public void unlock() {
        Activity activity = getCurrentActivity();

        if (activity != null) {
            activity.runOnUiThread(() -> {
                try {
                    activity.stopLockTask();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }
    }
}