import SoundPlayer from 'react-native-sound-player';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

function play(name, soundEnabled) {
  if (!soundEnabled) return;
  try {
    SoundPlayer.playSoundFile(name, 'wav');
  } catch (_) {}
}

function haptic(type, hapticEnabled) {
  if (!hapticEnabled) return;
  ReactNativeHapticFeedback.trigger(type, {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  });
}

export function playClick(soundEnabled, hapticEnabled = true) {
  play('click', soundEnabled);
  haptic('impactLight', hapticEnabled);
}

export function playCorrect(soundEnabled, hapticEnabled = true) {
  play('correct', soundEnabled);
  haptic('notificationSuccess', hapticEnabled);
}

export function playWrong(soundEnabled, hapticEnabled = true) {
  play('wrong', soundEnabled);
  haptic('notificationError', hapticEnabled);
}

export function playSuccess(soundEnabled, hapticEnabled = true) {
  play('success', soundEnabled);
  haptic('notificationSuccess', hapticEnabled);
}

export function initSounds() {}
