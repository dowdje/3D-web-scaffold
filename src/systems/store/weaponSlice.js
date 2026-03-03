import { WEAPON_DEFS, WEAPON_ORDER } from '../weapons'

const createInitialWeapons = () => {
  const weapons = {}
  for (const key of WEAPON_ORDER) {
    const def = WEAPON_DEFS[key]
    weapons[key] = {
      ammo: def.magSize,
      reserve: def.reserveAmmo,
    }
  }
  return weapons
}

export const createWeaponSlice = (set, get) => ({
  activeWeapon: 'rifle',
  weapons: createInitialWeapons(),
  reloading: false,
  reloadTimerId: null,

  getWeaponDef: () => WEAPON_DEFS[get().activeWeapon],

  fire: () => {
    const { activeWeapon, weapons, reloading } = get()
    const weapon = weapons[activeWeapon]
    if (!weapon || weapon.ammo <= 0 || reloading) return false

    set({
      weapons: {
        ...weapons,
        [activeWeapon]: { ...weapon, ammo: weapon.ammo - 1 },
      },
    })
    return true
  },

  startReload: () => {
    const { activeWeapon, weapons, reloading } = get()
    if (reloading) return
    const weapon = weapons[activeWeapon]
    const def = WEAPON_DEFS[activeWeapon]
    if (!weapon || weapon.ammo >= def.magSize || weapon.reserve <= 0) return

    set({ reloading: true })

    const timerId = setTimeout(() => {
      const { activeWeapon: currentWeapon, weapons: currentWeapons } = get()
      if (currentWeapon !== activeWeapon) {
        set({ reloading: false, reloadTimerId: null })
        return
      }
      const w = currentWeapons[currentWeapon]
      const d = WEAPON_DEFS[currentWeapon]
      const needed = d.magSize - w.ammo
      const available = Math.min(needed, w.reserve)

      set({
        reloading: false,
        reloadTimerId: null,
        weapons: {
          ...currentWeapons,
          [currentWeapon]: {
            ammo: w.ammo + available,
            reserve: w.reserve - available,
          },
        },
      })
    }, def.reloadTime)

    set({ reloadTimerId: timerId })
  },

  cancelReload: () => {
    const { reloadTimerId } = get()
    if (reloadTimerId) {
      clearTimeout(reloadTimerId)
      set({ reloading: false, reloadTimerId: null })
    }
  },

  swapWeapon: () => {
    const { activeWeapon } = get()
    get().cancelReload()
    const idx = WEAPON_ORDER.indexOf(activeWeapon)
    const next = WEAPON_ORDER[(idx + 1) % WEAPON_ORDER.length]
    set({ activeWeapon: next })
  },

  resetWeapons: () => {
    get().cancelReload()
    set({
      activeWeapon: 'rifle',
      weapons: createInitialWeapons(),
      reloading: false,
    })
  },
})
