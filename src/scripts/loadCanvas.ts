import type { DrawGridOptions } from "src/types/DrawGridOptions";
import { drawGrid } from "./drawGrid";

export function loadCanvas() {
  const canvas = document.getElementById("tilesCanvas") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element with id 'tilesCanvas' not found.");
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    console.error("Failed to get 2D context from the canvas.");
    return;
  }

  // Define options for drawGrid
  const options: DrawGridOptions = {
    canvas,
    context,
    // You can set additional options here if needed
  };

  // Start the grid drawing
  const { stop, onResize } = drawGrid(options);

  // Handle window resize
  window.addEventListener("resize", onResize);

  // Optional: Clean up when the page is unloaded
  window.addEventListener("beforeunload", () => {
    stop();
    window.removeEventListener("resize", onResize);
  });
}

document.addEventListener("DOMContentLoaded", loadCanvas);
