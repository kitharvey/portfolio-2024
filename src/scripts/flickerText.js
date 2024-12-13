export function startFlickeringText(container) {
  if (!container) return;

  const text = container.dataset.text || "Hello!";
  const tileSize = parseFloat(container.dataset.tilesize) || 4;
  const gap = parseFloat(container.dataset.gap) || 6;
  const tileColor = container.dataset.tilecolor || "#3498db";
  const tileOpacity = parseFloat(container.dataset.tileopacity) || 1;
  const flickerChance = parseFloat(container.dataset.flickerchance) || 0.3;
  const animationSpeed = parseFloat(container.dataset.animationspeed) || 60;
  const fontFamily = container.dataset.fontfamily || "Arial Black";
  const fontWeight = container.dataset.fontweight || "bold";
  const textScale = parseFloat(container.dataset.textscale) || 0.5;

  let tileDivs = [];
  let textGrid = null;
  let textSquares;
  let textGridWidth = 0;
  let textGridHeight = 0;
  let textStartX = 0;
  let textStartY = 0;
  let cols = 0;
  let rows = 0;
  let totalTileSize = 0;
  let animationFrameId = null;
  let lastTimestamp = 0;

  function flickerAnimation(squares, deltaTime, flickerChance, tileOpacity) {
    for (let i = 0; i < squares.length; i++) {
      if (Math.random() < flickerChance * deltaTime) {
        squares[i] = Math.random() * tileOpacity;
      }
    }
  }

  function initializeTextGrid(
    text,
    totalTileSize,
    fontWeight,
    fontFamily,
    cols,
    rows,
    textScale = 0.5,
  ) {
    if (!text) {
      return null;
    }

    const maxTextGridHeight = Math.floor(rows * textScale);
    const maxTextGridWidth = cols;

    const textCanvas = document.createElement("canvas");
    const textContext = textCanvas.getContext("2d");

    let fontSize = 240;
    let textMetrics;
    let textWidthInPixels;
    let textHeightInPixels;

    let localTextGridWidth;
    let localTextGridHeight;

    for (let i = 0; i < 10; i++) {
      textContext.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      textMetrics = textContext.measureText(text);
      textWidthInPixels = textMetrics.width;
      textHeightInPixels = fontSize;

      localTextGridHeight = Math.ceil(textHeightInPixels / totalTileSize);
      localTextGridWidth = Math.ceil(textWidthInPixels / totalTileSize);

      if (
        localTextGridHeight <= maxTextGridHeight &&
        localTextGridWidth <= maxTextGridWidth
      ) {
        break;
      }

      const heightRatio = maxTextGridHeight / localTextGridHeight;
      const widthRatio = maxTextGridWidth / localTextGridWidth;
      const scaleRatio = Math.min(heightRatio, widthRatio);

      fontSize = Math.floor(fontSize * scaleRatio);
    }

    textContext.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    textMetrics = textContext.measureText(text);
    textWidthInPixels = textMetrics.width;
    textHeightInPixels = fontSize;
    localTextGridHeight = Math.ceil(textHeightInPixels / totalTileSize);
    localTextGridWidth = Math.ceil(textWidthInPixels / totalTileSize);

    const textCanvasWidth = localTextGridWidth * totalTileSize;
    const textCanvasHeight = localTextGridHeight * totalTileSize;

    textCanvas.width = textCanvasWidth;
    textCanvas.height = textCanvasHeight;

    textContext.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    textContext.fillStyle = "white";
    textContext.textBaseline = "middle";
    textContext.textAlign = "center";

    textContext.clearRect(0, 0, textCanvasWidth, textCanvasHeight);
    textContext.fillText(text, textCanvasWidth / 2, textCanvasHeight / 2);

    const imageData = textContext.getImageData(
      0,
      0,
      textCanvasWidth,
      textCanvasHeight,
    );
    const textPixels = imageData.data;

    const textGrid = [];

    for (let ty = 0; ty < localTextGridHeight; ty++) {
      const row = [];
      for (let tx = 0; tx < localTextGridWidth; tx++) {
        const pixelX = Math.floor((tx / localTextGridWidth) * textCanvasWidth);
        const pixelY = Math.floor(
          (ty / localTextGridHeight) * textCanvasHeight,
        );
        const pixelIndex = (pixelY * textCanvasWidth + pixelX) * 4;
        const alpha = textPixels[pixelIndex + 3];
        row.push(alpha > 128);
      }
      textGrid.push(row);
    }

    const textStartX = Math.floor((cols - localTextGridWidth) / 2);
    const textStartY = Math.floor((rows - localTextGridHeight) / 2);

    return {
      textGrid,
      textGridWidth: localTextGridWidth,
      textGridHeight: localTextGridHeight,
      textStartX,
      textStartY,
    };
  }

  function getGridSize() {
    if (!container) return { cols: 0, rows: 0, totalTileSize: 0 };

    // Use only the container's size, ensuring the grid fully depends on parent's width/height
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const totalTileSize = tileSize + gap;
    const cols = Math.ceil(containerWidth / totalTileSize);
    const rows = Math.ceil(containerHeight / totalTileSize);
    return { cols, rows, totalTileSize };
  }

  function createTiles() {
    if (!textGrid || !container) return;
    tileDivs = new Array(textGridWidth * textGridHeight).fill(null);

    for (let ty = 0; ty < textGridHeight; ty++) {
      for (let tx = 0; tx < textGridWidth; tx++) {
        if (textGrid[ty][tx]) {
          const x = textStartX + tx;
          const y = textStartY + ty;
          if (x >= 0 && x < cols && y >= 0 && y < rows) {
            const posX = x * totalTileSize;
            const posY = y * totalTileSize;

            const tile = document.createElement("div");
            tile.style.position = "absolute";
            tile.style.width = tileSize + "px";
            tile.style.height = tileSize + "px";
            tile.style.left = posX - tileSize + "px";
            tile.style.top = posY - tileSize + "px";
            tile.style.borderRadius = "50%";
            tile.style.backgroundColor = tileColor;
            tile.style.opacity = "0";
            container.appendChild(tile);
            tileDivs[ty * textGridWidth + tx] = tile;
          }
        }
      }
    }
  }

  function animate(timestamp) {
    animationFrameId = requestAnimationFrame(animate);
    const delta = (timestamp - lastTimestamp) / 1000;
    const timePerFrame = 1 / animationSpeed;
    if (delta >= timePerFrame) {
      lastTimestamp = timestamp;
      flickerAnimation(textSquares, delta, flickerChance, tileOpacity);

      // Update tile opacity
      for (let i = 0; i < textSquares.length; i++) {
        const tile = tileDivs[i];
        if (tile) {
          tile.style.opacity = (textSquares[i] / tileOpacity).toString();
        }
      }
    }
  }

  function initialize() {
    if (!container) return;
    const size = getGridSize();
    cols = size.cols;
    rows = size.rows;
    totalTileSize = size.totalTileSize;

    const result = initializeTextGrid(
      text,
      totalTileSize,
      fontWeight,
      fontFamily,
      cols,
      rows,
      textScale,
    );
    if (!result) return;
    textGrid = result.textGrid;
    textGridWidth = result.textGridWidth;
    textGridHeight = result.textGridHeight;
    textStartX = result.textStartX;
    textStartY = result.textStartY;

    textSquares = new Float32Array(textGridWidth * textGridHeight);
    for (let i = 0; i < textSquares.length; i++) {
      textSquares[i] = Math.random() * tileOpacity;
    }

    container.innerHTML = "";
    createTiles();
    lastTimestamp = performance.now();
    animationFrameId = requestAnimationFrame(animate);
  }

  function onResize() {
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    initialize();
  }

  initialize();
  window.addEventListener("resize", onResize);

  window.addEventListener("beforeunload", () => {
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    window.removeEventListener("resize", onResize);
  });
}
