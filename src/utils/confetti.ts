import confetti from 'canvas-confetti';

export function triggerCelebration() {
  try {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
    });
  } catch {
    // Ignore in non-browser or test environments
  }
}
