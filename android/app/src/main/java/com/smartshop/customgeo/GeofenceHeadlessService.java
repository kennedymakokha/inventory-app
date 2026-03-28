package com.smartshop.customgeo;

import android.content.Intent;
import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

public class GeofenceHeadlessService extends HeadlessJsTaskService {

    @Override
    protected com.facebook.react.jstasks.HeadlessJsTaskConfig getTaskConfig(Intent intent) {
        if (intent == null) return null;

        boolean isInside = intent.getBooleanExtra("isInside", false);
        String fenceId = intent.getStringExtra("fenceId");

        WritableMap data = Arguments.createMap();
        data.putBoolean("isInside", isInside);
        data.putString("fenceId", fenceId);

        return new com.facebook.react.jstasks.HeadlessJsTaskConfig(
                "GeofenceTask", // 🔥 JS task name
                data,
                5000, // timeout
                true // allowed in foreground
        );
    }
}