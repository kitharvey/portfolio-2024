import { drawGrid } from "./drawGrid";

const loadCanvas = () => {
  const canvas = document.getElementById("tilesCanvas") as HTMLCanvasElement;
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;

  drawGrid({ canvas, context });
  window.addEventListener("resize", () => drawGrid({ canvas, context }));

  // Placeholder for future animations
  // You can extend or modify the drawGrid function to add animations
};
document.addEventListener("DOMContentLoaded", loadCanvas);
