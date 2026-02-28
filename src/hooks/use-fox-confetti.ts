import confetti from "canvas-confetti";

export function useFoxConfetti() {
  const triggerCelebration = () => {
    const end = Date.now() + 1500;

    const colors = ["#ff5a1f", "#ffffff", "#000000"]; // Fox colors

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const triggerTailWag = () => {
    // Shorter, simpler confetti
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#ff5a1f"],
    });
  };

  return { triggerCelebration, triggerTailWag };
}
