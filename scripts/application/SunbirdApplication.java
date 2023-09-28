package org.sunbird;

import androidx.multidex.MultiDexApplication;

import org.sunbird.config.BuildConfigUtil;

/**
 * Created by swayangjit on 12/4/19.
 */
public class SunbirdApplication extends MultiDexApplication {
    public static final String PACKAGE_NAME = "org.sunbird.app";

    @Override
    public void onCreate() {
        super.onCreate();
    }
}
