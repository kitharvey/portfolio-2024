import { flickerAnimation } from "./flickerAnimation";

export interface DrawGridOptions {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  tileSize?: number;
  gap?: number;
  tileColor?: string;
  tileOpacity?: number;
  animationType?: "none" | "flicker" | "snake" | "tetris";
  animationSpeed?: number; // Frames per second
  flickerChance?: number;
  deltaTime?: number;
  text?: string;
  textSize?: number; // Height of text in grid tiles
  textPosition?: { x: number; y: number }; // Position in grid tiles
  fontFamily?: string; // New option for font family
  fontWeight?: string; // New option for font weight
}

export function drawGrid(options: DrawGridOptions): void {
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
    textSize = 30, // Default text height in grid tiles
    textPosition,
    fontFamily = "Arial Black", // Default font family
    fontWeight = "bold", // Default font weight
  } = options;

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const totalTileSize = tileSize + gap;
  const cols = Math.ceil(width / totalTileSize);
  const rows = Math.ceil(height / totalTileSize);

  let animationFrameId: number | null = null;
  let lastTimestamp = 0;

  const squares = new Float32Array(cols * rows);

  for (let i = 0; i < squares.length; i++) {
    squares[i] = Math.random() * tileOpacity;
  }

  if (animationType === "snake") {
    initializeSnakeGame();
  } else if (animationType === "tetris") {
    initializeTetrisGame();
  }

  // Prepare text rendering if text is provided
  let textGrid: boolean[][] | null = null;
  let textGridWidth = 0;
  let textGridHeight = 0;
  let textStartX = 0;
  let textStartY = 0;

  if (text) {
    const textCanvas = document.createElement("canvas");
    const textContext = textCanvas.getContext("2d")!;

    // Render text at default font size
    const initialFontSize = 120;
    textContext.font = `${fontWeight} ${initialFontSize}px ${fontFamily}`;
    const textMetrics = textContext.measureText(text);
    const textWidthAtInitialSize = textMetrics.width;
    const textHeightAtInitialSize = initialFontSize;

    // Calculate aspect ratio
    const textAspectRatio = textWidthAtInitialSize / textHeightAtInitialSize;

    // Calculate text width in tiles
    textGridHeight = textSize;
    textGridWidth = Math.floor(textGridHeight * textAspectRatio);

    // Set canvas size in pixels, based on desired text size in tiles
    const textCanvasWidth = textGridWidth * totalTileSize;
    const textCanvasHeight = textGridHeight * totalTileSize;

    textCanvas.width = textCanvasWidth;
    textCanvas.height = textCanvasHeight;

    // Set font size to match canvas height
    const fontSize = textCanvasHeight;
    textContext.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    textContext.fillStyle = "white";
    textContext.textBaseline = "middle";
    textContext.textAlign = "center";
    textContext.fillText(text, textCanvasWidth / 2, textCanvasHeight / 2);

    // Get pixel data
    const imageData = textContext.getImageData(
      0,
      0,
      textCanvas.width,
      textCanvas.height,
    );
    const textPixels = imageData.data;

    // Create text grid
    textGrid = [];

    for (let ty = 0; ty < textGridHeight; ty++) {
      const row = [];
      for (let tx = 0; tx < textGridWidth; tx++) {
        // Map tile position to text pixel position
        const pixelX = Math.floor((tx / textGridWidth) * textCanvasWidth);
        const pixelY = Math.floor((ty / textGridHeight) * textCanvasHeight);
        const pixelIndex = (pixelY * textCanvasWidth + pixelX) * 4;
        const alpha = textPixels[pixelIndex + 3];

        row.push(alpha > 128); // true if pixel is opaque
      }
      textGrid.push(row);
    }

    // Calculate text position in tiles
    textStartX =
      textPosition?.x !== undefined
        ? textPosition.x
        : Math.floor((cols - textGridWidth) / 2);
    textStartY =
      textPosition?.y !== undefined
        ? textPosition.y
        : Math.floor((rows - textGridHeight) / 2);
  }

  function drawFrame(timestamp: number) {
    const delta = (timestamp - lastTimestamp) / 1000;
    const timePerFrame = 1 / animationSpeed;

    if (delta >= timePerFrame) {
      lastTimestamp = timestamp;

      if (animationType === "flicker") {
        flickerAnimation(squares, delta, flickerChance, tileOpacity);
      } else if (animationType === "snake") {
        updateSnakeGame();
      } else if (animationType === "tetris") {
        updateTetrisGame();
      }

      context.clearRect(0, 0, width, height);

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
              if (isTextTile) {
                currentOpacity = squares[index];
              } else {
                currentOpacity = 0;
              }
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
    }

    if (animationType !== "none") {
      animationFrameId = requestAnimationFrame(drawFrame);
    }
  }

  animationFrameId = requestAnimationFrame(drawFrame);

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawFrame(performance.now());
  });

  (window as any).stopAnimation = () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  function initializeSnakeGame() {
    // Initialize snake game data
  }

  function updateSnakeGame() {
    // Update snake position and state
  }

  function isSnakeSegment(x: number, y: number): boolean {
    return false; // Placeholder
  }

  function initializeTetrisGame() {
    // Initialize tetris game data
  }

  function updateTetrisGame() {
    // Update tetris game state
  }

  function isTetrisBlock(x: number, y: number): boolean {
    return false; // Placeholder
  }
}
