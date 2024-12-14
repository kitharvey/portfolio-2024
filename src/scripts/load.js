import { startFlickeringText } from "./flicker";

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("tilesContainer");
  startFlickeringText(container);
});
