/**
 * Weapon definitions.
 * Each weapon has its own fire mode, damage, and ammo characteristics.
 */
export const WEAPON_DEFS = {
  rifle: {
    name: 'Rifle',
    type: 'hitscan',
    damage: 15,
    fireRate: 8,        // rounds per second
    range: 200,
    magSize: 30,
    reserveAmmo: 120,
    reloadTime: 1500,   // ms
  },
  launcher: {
    name: 'Launcher',
    type: 'projectile',
    damage: 60,
    fireRate: 1,
    range: 150,
    magSize: 4,
    reserveAmmo: 12,
    reloadTime: 2500,
    projectileSpeed: 40,
    splashRadius: 8,
  },
}

export const WEAPON_ORDER = ['rifle', 'launcher']
