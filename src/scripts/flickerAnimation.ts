export function flickerAnimation(
  squares: Float32Array,
  deltaTime: number,
  flickerChance: number,
  tileOpacity: number,
) {
  for (let i = 0; i < squares.length; i++) {
    if (Math.random() < flickerChance * deltaTime) {
      squares[i] = Math.random() * tileOpacity;
    }
  }
}
