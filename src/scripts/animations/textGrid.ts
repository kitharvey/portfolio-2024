// initializeTextGrid.ts

export interface TextGridResult {
  textGrid: boolean[][];
  textGridWidth: number;
  textGridHeight: number;
  textStartX: number;
  textStartY: number;
}

export function initializeTextGrid(
  text: string,
  totalTileSize: number,
  fontWeight: string,
  fontFamily: string,
  textPosition: { x?: number; y?: number } | undefined,
  cols: number,
  rows: number,
  textScale: number = 0.5, // Proportion of grid height (default to 50%)
): TextGridResult | null {
  if (!text) {
    return null;
  }

  /*** Calculate Text Grid Dimensions ***/

  // Determine maximum text grid dimensions based on textScale
  const maxTextGridHeight = Math.floor(rows * textScale);
  const maxTextGridWidth = cols;

  const textCanvas = document.createElement("canvas");
  const textContext = textCanvas.getContext("2d")!;

  // Start with an initial font size
  let fontSize = 240;
  let textMetrics;
  let textWidthInPixels;
  let textHeightInPixels;
  let textGridWidth;
  let textGridHeight;

  // Adjust font size to make the text fit within the grid
  for (let i = 0; i < 10; i++) {
    // Limit iterations to prevent infinite loops
    textContext.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    textMetrics = textContext.measureText(text);
    textWidthInPixels = textMetrics.width;
    textHeightInPixels = fontSize; // Approximate text height

    textGridHeight = Math.ceil(textHeightInPixels / totalTileSize);
    textGridWidth = Math.ceil(textWidthInPixels / totalTileSize);

    // Check if text fits within the grid
    if (
      textGridHeight <= maxTextGridHeight &&
      textGridWidth <= maxTextGridWidth
    ) {
      break; // Text fits, exit the loop
    }

    // Adjust font size based on the ratio
    const heightRatio = maxTextGridHeight / textGridHeight;
    const widthRatio = maxTextGridWidth / textGridWidth;
    const scaleRatio = Math.min(heightRatio, widthRatio);

    fontSize = Math.floor(fontSize * scaleRatio * 0.9); // Reduce font size slightly more to ensure fit
  }

  // Recalculate with the adjusted font size
  textContext.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  textMetrics = textContext.measureText(text);
  textWidthInPixels = textMetrics.width;
  textHeightInPixels = fontSize;
  textGridHeight = Math.ceil(textHeightInPixels / totalTileSize);
  textGridWidth = Math.ceil(textWidthInPixels / totalTileSize);

  // Set canvas size based on text dimensions
  const textCanvasWidth = textGridWidth * totalTileSize;
  const textCanvasHeight = textGridHeight * totalTileSize;

  textCanvas.width = textCanvasWidth;
  textCanvas.height = textCanvasHeight;

  textContext.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  textContext.fillStyle = "white";
  textContext.textBaseline = "middle";
  textContext.textAlign = "center";

  // Render the text onto the canvas
  textContext.clearRect(0, 0, textCanvasWidth, textCanvasHeight);
  textContext.fillText(text, textCanvasWidth / 2, textCanvasHeight / 2);

  /*** Generate Text Grid ***/

  // Get pixel data from the canvas
  const imageData = textContext.getImageData(
    0,
    0,
    textCanvasWidth,
    textCanvasHeight,
  );
  const textPixels = imageData.data;

  // Create a 2D boolean array representing the text
  const textGrid: boolean[][] = [];

  for (let ty = 0; ty < textGridHeight; ty++) {
    const row = [];
    for (let tx = 0; tx < textGridWidth; tx++) {
      // Map tile position to pixel position
      const pixelX = Math.floor((tx / textGridWidth) * textCanvasWidth);
      const pixelY = Math.floor((ty / textGridHeight) * textCanvasHeight);
      const pixelIndex = (pixelY * textCanvasWidth + pixelX) * 4;
      const alpha = textPixels[pixelIndex + 3];

      row.push(alpha > 128); // True if pixel is opaque
    }
    textGrid.push(row);
  }

  /*** Calculate Text Position ***/

  const textStartX =
    textPosition?.x !== undefined
      ? textPosition.x
      : Math.floor((cols - textGridWidth) / 2);
  const textStartY =
    textPosition?.y !== undefined
      ? textPosition.y
      : Math.floor((rows - textGridHeight) / 2);

  return {
    textGrid,
    textGridWidth,
    textGridHeight,
    textStartX,
    textStartY,
  };
}
