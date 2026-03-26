package com.smartshop

import android.os.Bundle
import android.view.View // Crucial for View.SYSTEM_UI...
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.app.admin.DevicePolicyManager
import android.content.Context
class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "smartshop"

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }

  // ✅ Fixed Kotlin syntax for onResume
  override fun onResume() {
      super.onResume()

      window.decorView.systemUiVisibility = (
          View.SYSTEM_UI_FLAG_LAYOUT_STABLE
          or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
          or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
          or View.SYSTEM_UI_FLAG_IMMERSIVE
      )
  }

  override fun onBackPressed() {
    // Leave empty to do nothing and block the back button
  }
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}