/**
 * Native (Capacitor) bootstrap — a thin no-op on the web. The game itself is
 * unchanged; this only handles the shell: a fullscreen immersive view (no status
 * or nav bars), dismissing the launch splash once the canvas is up, and routing
 * the Android hardware Back button through the game's own ESC handling (pause
 * in-game, back-out of menus) so Back never yanks the player out of a level.
 *
 * Orientation is locked to landscape in the native projects (AndroidManifest.xml
 * / Info.plist), and ads stay OFF on native (PlatformDetector resolves to the
 * no-op 'local' adapter off-portal) — so v1 ships with no ad SDK to disclose.
 *
 * Plugin calls are wrapped: if a plugin is missing (e.g. web) they silently
 * no-op, so importing this on the web is harmless.
 */
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const isNative = (): boolean => Capacitor.isNativePlatform();

const IMPACT = {
  light: ImpactStyle.Light,
  medium: ImpactStyle.Medium,
  heavy: ImpactStyle.Heavy,
} as const;

/** A short haptic tap on the native apps (stomps, hits, boss slams). No-op on
 *  the web — and fire-and-forget, so a missing vibrator can never throw. */
export function buzz(style: keyof typeof IMPACT): void {
  if (!isNative()) return;
  void Haptics.impact({ style: IMPACT[style] }).catch(() => {
    /* no vibrator / permission — silently fine */
  });
}

export async function initNative(): Promise<void> {
  if (!isNative()) return;
  // fullscreen game — no OS status bar over the canvas
  try {
    await StatusBar.hide();
  } catch {
    /* status bar plugin unavailable on this platform */
  }
  // hardware Back == ESC: pause during play, step back through menus. Leaving
  // the app is the OS home/gesture's job, never an accidental Back press.
  try {
    await App.addListener('backButton', () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }),
      );
    });
  } catch {
    /* app plugin unavailable */
  }
}

/** Dismiss the native launch splash once the game canvas is up. */
export async function hideSplash(): Promise<void> {
  if (!isNative()) return;
  try {
    await SplashScreen.hide();
  } catch {
    /* splash plugin unavailable */
  }
}
