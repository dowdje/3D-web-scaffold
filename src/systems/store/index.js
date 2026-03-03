import { create } from 'zustand'
import { createPlayerSlice } from './playerSlice'
import { createWeaponSlice } from './weaponSlice'
import { createCombatSlice } from './combatSlice'
import { createGameSlice } from './gameSlice'

export const useGameStore = create((set, get) => ({
  ...createPlayerSlice(set, get),
  ...createWeaponSlice(set, get),
  ...createCombatSlice(set, get),
  ...createGameSlice(set, get),
}))
