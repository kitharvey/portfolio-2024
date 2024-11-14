// src/animations/snakeGame.ts

let snakeSegments: { x: number; y: number }[] = [];
let direction: { x: number; y: number } = { x: 1, y: 0 };

export function initializeSnakeGame() {
  // Initialize the snake in the middle of the grid
  snakeSegments = [{ x: 5, y: 5 }];
  direction = { x: 1, y: 0 };
}

export function updateSnakeGame() {
  // Move the snake by adding a new head based on the current direction
  const head = snakeSegments[0];
  const newHead = { x: head.x + direction.x, y: head.y + direction.y };

  // Add the new head to the front of the snake
  snakeSegments.unshift(newHead);

  // Remove the last segment to simulate movement
  snakeSegments.pop();

  // Add logic for collisions, food, etc., if desired
}

export function isSnakeSegment(x: number, y: number): boolean {
  return snakeSegments.some((segment) => segment.x === x && segment.y === y);
}
