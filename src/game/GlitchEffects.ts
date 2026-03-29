import { Container, ColorMatrixFilter, NoiseFilter } from "pixi.js";

export function applyGlitch(container: Container, intensity: number = 1) {
  const colorMatrix = new ColorMatrixFilter();
  const noise = new NoiseFilter();

  // Hue shift based on intensity
  colorMatrix.hue(intensity * 90, false);
  noise.noise = intensity * 0.5;

  container.filters = [colorMatrix, noise];

  // Screen shake
  const originalX = container.x;
  const originalY = container.y;
  const shakeAmount = intensity * 8;

  let frame = 0;
  const totalFrames = 15; // ~0.25s at 60fps

  const shake = () => {
    if (frame >= totalFrames) {
      container.x = originalX;
      container.y = originalY;
      container.filters = [];
      return;
    }
    container.x = originalX + (Math.random() - 0.5) * shakeAmount;
    container.y = originalY + (Math.random() - 0.5) * shakeAmount;

    // Reduce hue shift over time
    const progress = frame / totalFrames;
    colorMatrix.hue((1 - progress) * intensity * 90, false);
    noise.noise = (1 - progress) * intensity * 0.5;

    frame++;
    requestAnimationFrame(shake);
  };

  requestAnimationFrame(shake);
}
