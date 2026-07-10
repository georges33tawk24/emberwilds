import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Native shell config (Capacitor 8). The whole built game (dist/) is bundled
 * INTO the app so it runs fully offline — this is what keeps it clear of Apple
 * guideline 4.2 (it's a real app, not a thin website wrapper) and means no
 * dependency on emberwilds.fun at runtime. Fullscreen, landscape, warm splash.
 */
const config: CapacitorConfig = {
  appId: 'fun.emberwilds.game',
  appName: 'Emberwilds',
  webDir: 'dist',
  backgroundColor: '#14100d',
  android: {
    backgroundColor: '#14100d',
    // keep the WebView from ever letting the page scroll/bounce (it's a game)
    allowMixedContent: false,
  },
  ios: {
    backgroundColor: '#14100d',
    contentInset: 'never',
    scrollEnabled: false,
    limitsNavigationsToAppBoundDomains: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      launchAutoHide: false, // we hide it from code once the game is ready
      backgroundColor: '#14100d',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#00000000',
    },
  },
};

export default config;
