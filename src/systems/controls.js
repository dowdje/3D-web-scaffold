export const Controls = {
  forward: 'forward',
  backward: 'backward',
  left: 'left',
  right: 'right',
  jump: 'jump',
  sprint: 'sprint',
}

export const CONTROLS_MAP = [
  { name: Controls.forward, keys: ['KeyW', 'ArrowUp'] },
  { name: Controls.backward, keys: ['KeyS', 'ArrowDown'] },
  { name: Controls.left, keys: ['KeyA', 'ArrowLeft'] },
  { name: Controls.right, keys: ['KeyD', 'ArrowRight'] },
  { name: Controls.jump, keys: ['Space'] },
  { name: Controls.sprint, keys: ['ShiftLeft', 'ShiftRight'] },
]
