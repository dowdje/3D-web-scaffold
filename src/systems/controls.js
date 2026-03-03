export const Controls = {
  forward: 'forward',
  backward: 'backward',
  left: 'left',
  right: 'right',
  strafeLeft: 'strafeLeft',
  strafeRight: 'strafeRight',
  jump: 'jump',
  sprint: 'sprint',
  weaponSwap: 'weaponSwap',
  reload: 'reload',
  fire: 'fire',
}

export const CONTROLS_MAP = [
  { name: Controls.forward, keys: ['KeyW', 'ArrowUp'] },
  { name: Controls.backward, keys: ['KeyS', 'ArrowDown'] },
  { name: Controls.left, keys: ['KeyA', 'ArrowLeft'] },
  { name: Controls.right, keys: ['KeyD', 'ArrowRight'] },
  { name: Controls.strafeLeft, keys: ['KeyQ'] },
  { name: Controls.strafeRight, keys: ['KeyE'] },
  { name: Controls.jump, keys: ['Space'] },
  { name: Controls.sprint, keys: ['ShiftLeft', 'ShiftRight'] },
  { name: Controls.weaponSwap, keys: ['KeyF'] },
  { name: Controls.reload, keys: ['KeyR'] },
  { name: Controls.fire, keys: ['KeyK'] },
]
