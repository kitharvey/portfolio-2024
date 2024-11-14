// drawGrid.ts

import {
  initializeSnakeGame,
  updateSnakeGame,
  isSnakeSegment,
} from "./animations/snakeGame";
import {
  initializeTetrisGame,
  updateTetrisGame,
  isTetrisBlock,
} from "./animations/tetrisGame";
import { flickerAnimation } from "./animations/flickerAnimation";
import type { DrawGridOptions } from "src/types/DrawGridOptions";
import { initializeTextGrid } from "./animations/textGrid";

export function drawGrid(options: DrawGridOptions) {
  // Destructure options with default values
  const {
    canvas,
    context,
    tileSize = 4,
    gap = 6,
    tileColor = "#3498db",
    tileOpacity = 1,
    animationType = "flicker",
    animationSpeed = 60,
    flickerChance = 0.3,
    text = "kitharvey",
    textScale = 1, // Proportion of grid height for text
    textPosition,
    fontFamily = "Arial Black",
    fontWeight = "bold",
  } = options;

  /*** Variables and Constants ***/

  let totalTileSize = tileSize + gap;
  let cols: number;
  let rows: number;
  let animationFrameId: number | null = null;
  let lastTimestamp = 0;
  let squares: Float32Array;

  // Text grid variables
  let textGrid: boolean[][] | null = null;
  let textGridWidth = 0;
  let textGridHeight = 0;
  let textStartX = 0;
  let textStartY = 0;

  function initializeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    cols = Math.ceil(canvas.width / totalTileSize);
    rows = Math.ceil(canvas.height / totalTileSize);

    squares = new Float32Array(cols * rows);
    for (let i = 0; i < squares.length; i++) {
      squares[i] = Math.random() * tileOpacity;
    }

    // Use the imported initializeTextGrid function
    const textGridResult = initializeTextGrid(
      text,
      totalTileSize,
      fontWeight,
      fontFamily,
      textPosition,
      cols,
      rows,
      textScale, // Pass the textScale parameter
    );

    if (textGridResult) {
      textGrid = textGridResult.textGrid;
      textGridWidth = textGridResult.textGridWidth;
      textGridHeight = textGridResult.textGridHeight;
      textStartX = textGridResult.textStartX;
      textStartY = textGridResult.textStartY;
    } else {
      textGrid = null;
      textGridWidth = 0;
      textGridHeight = 0;
      textStartX = 0;
      textStartY = 0;
    }
  }

  /*** Event Handlers ***/

  function onWindowResize() {
    initializeCanvas();
  }

  /*** Animation Loop ***/

  function drawFrame(timestamp: number) {
    animationFrameId = requestAnimationFrame(drawFrame);

    const delta = (timestamp - lastTimestamp) / 1000;
    const timePerFrame = 1 / animationSpeed;

    if (delta >= timePerFrame) {
      lastTimestamp = timestamp;

      switch (animationType) {
        case "flicker":
          flickerAnimation(squares, delta, flickerChance, tileOpacity);
          break;
        case "snake":
          updateSnakeGame();
          break;
        case "tetris":
          updateTetrisGame();
          break;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      drawGridTiles();
    }
  }

  /*** Drawing Functions ***/

  function drawGridTiles() {
    context.save(); // Save the current state
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const index = y * cols + x;
        const posX = x * totalTileSize + tileSize / 2;
        const posY = y * totalTileSize + tileSize / 2;

        let currentOpacity = tileOpacity;
        let isTextTile = false;

        if (textGrid) {
          const gridRelX = x - textStartX;
          const gridRelY = y - textStartY;

          if (
            gridRelX >= 0 &&
            gridRelX < textGridWidth &&
            gridRelY >= 0 &&
            gridRelY < textGridHeight
          ) {
            isTextTile = textGrid[gridRelY][gridRelX];
          }
        }

        switch (animationType) {
          case "flicker":
            currentOpacity = isTextTile ? squares[index] : 0;
            break;
          case "snake":
            currentOpacity = isSnakeSegment(x, y) ? 1 : 0;
            break;
          case "tetris":
            currentOpacity = isTetrisBlock(x, y) ? 1 : 0;
            break;
          default:
            currentOpacity = isTextTile ? tileOpacity : 0;
            break;
        }

        if (currentOpacity > 0) {
          context.globalAlpha = currentOpacity;
          context.fillStyle = tileColor;
          context.beginPath();
          context.arc(posX, posY, tileSize / 2, 0, Math.PI * 2);
          context.fill();
        }
      }
    }
    context.restore(); // Restore the previous state
  }

  /*** Initialization and Event Listener Setup ***/

  initializeCanvas();

  if (animationType === "snake") {
    initializeSnakeGame();
  } else if (animationType === "tetris") {
    initializeTetrisGame();
  }

  animationFrameId = requestAnimationFrame(drawFrame);

  /*** Cleanup Function ***/

  function stop() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  // Expose the stop function and onResize handler
  return { stop, onResize: onWindowResize };
}
