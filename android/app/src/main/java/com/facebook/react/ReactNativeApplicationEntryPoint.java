package com.facebook.react;

import android.app.Application;
import android.content.Context;
import android.content.res.Resources;

import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.views.view.WindowUtilKt;
import com.facebook.react.soloader.OpenSourceMergedSoMapping;
import com.facebook.soloader.SoLoader;
import java.io.IOException;

/**
 * This class is the entry point for loading React Native using the configuration
 * The `loadReactNative(this)` method invocation should be called inside the
 * Application.onCreate() method.
 */
public class ReactNativeApplicationEntryPoint {
  public static void loadReactNative(Context context) {
    try {
       SoLoader.init(context, OpenSourceMergedSoMapping.INSTANCE);
    } catch (IOException error) {
    }
    if (com.captoutapp.BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      DefaultNewArchitectureEntryPoint.load();
    }
    if (com.captoutapp.BuildConfig.IS_EDGE_TO_EDGE_ENABLED) {
      WindowUtilKt.setEdgeToEdgeFeatureFlagOn();
    }
  }
}
