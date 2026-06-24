# React Native
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# LiveKit
-keep class livekit.** { *; }

# OkHttp / Socket.IO
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-keep class com.squareup.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# Keep custom models
-keep class com.tech42.edulink.** { *; }
