export interface DrawGridOptions {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  tileSize?: number;
  gap?: number;
  tileColor?: string;
  tileOpacity?: number;
  animationType?: "none" | "flicker" | "snake" | "tetris";
  animationSpeed?: number;
  flickerChance?: number;
  deltaTime?: number;
  text?: string;
  textScale?: number; // Proportion of grid height for text
  textPosition?: { x: number; y: number };
  fontFamily?: string;
  fontWeight?: string;
}
