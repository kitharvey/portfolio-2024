import { startFlickeringText } from "./FlickerText";

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("tilesContainer");
  startFlickeringText(container);
});
