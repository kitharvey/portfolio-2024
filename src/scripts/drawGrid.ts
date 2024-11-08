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
}

export function drawGrid(options: DrawGridOptions): void {
  const {
    canvas,
    context,
    tileSize = 4,
    gap = 6,
    tileColor = "#3498db",
    tileOpacity = 0.3,
    animationType = "flicker",
    animationSpeed = 60,
    flickerChance = 0.3,
  } = options;

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const totalTileSize = tileSize + gap;
  const cols = Math.ceil(width / totalTileSize);
  const rows = Math.ceil(height / totalTileSize);

  let animationFrameId: number | null = null;
  let lastTimestamp = 0;

  // Create the squares array to hold opacity values
  const squares = new Float32Array(cols * rows);

  // Initialize the squares array with random opacities
  for (let i = 0; i < squares.length; i++) {
    squares[i] = Math.random() * tileOpacity;
  }

  // Update squares function for flickering effect
  function updateSquares(squares: Float32Array, deltaTime: number) {
    for (let i = 0; i < squares.length; i++) {
      if (Math.random() < flickerChance * deltaTime) {
        squares[i] = Math.random() * tileOpacity;
      }
    }
  }

  // Initialize game data if needed
  if (animationType === "snake") {
    initializeSnakeGame();
  } else if (animationType === "tetris") {
    initializeTetrisGame();
  }

  function drawFrame(timestamp: number) {
    const delta = (timestamp - lastTimestamp) / 1000; // Convert to seconds
    const timePerFrame = 1 / animationSpeed;

    if (delta >= timePerFrame) {
      lastTimestamp = timestamp;

      // Update game state
      if (animationType === "flicker") {
        updateSquares(squares, delta);
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

          switch (animationType) {
            case "flicker":
              currentOpacity = squares[index];
              break;
            case "snake":
              currentOpacity = isSnakeSegment(x, y) ? 1 : 0;
              break;
            case "tetris":
              currentOpacity = isTetrisBlock(x, y) ? 1 : 0;
              break;
            default:
              currentOpacity = tileOpacity;
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

    // Continue animation if necessary
    if (animationType !== "none") {
      animationFrameId = requestAnimationFrame(drawFrame);
    }
  }

  // Start the animation
  animationFrameId = requestAnimationFrame(drawFrame);

  // Handle window resize
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawFrame(performance.now());
  });

  // Expose a method to stop the animation
  (window as any).stopAnimation = () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  // Placeholder functions for future game logic
  function initializeSnakeGame() {
    // Initialize snake game data
  }

  function updateSnakeGame() {
    // Update snake position and state
  }

  function isSnakeSegment(x: number, y: number): boolean {
    // Determine if the tile at (x, y) is part of the snake
    return false; // Placeholder
  }

  function initializeTetrisGame() {
    // Initialize tetris game data
  }

  function updateTetrisGame() {
    // Update tetris game state
  }

  function isTetrisBlock(x: number, y: number): boolean {
    // Determine if the tile at (x, y) is part of a tetris block
    return false; // Placeholder
  }
}
