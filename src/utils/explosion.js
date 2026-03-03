import { getEntityByCollider } from './entityRegistry'

/**
 * Trigger an area-of-effect explosion using Rapier sphere intersection.
 * Applies damage with linear distance falloff.
 */
export function triggerExplosion(world, rapier, position, store, radius = 8, damage = 60) {
  const shape = new rapier.Ball(radius)
  const shapePos = { x: position[0], y: position[1], z: position[2] }
  const shapeRot = { w: 1, x: 0, y: 0, z: 0 }

  const damaged = new Set()

  world.intersectionsWithShape(shapePos, shapeRot, shape, (collider) => {
    const entity = getEntityByCollider(collider.handle)
    if (entity && !damaged.has(entity.id)) {
      damaged.add(entity.id)

      // Distance falloff
      const dx = collider.translation().x - position[0]
      const dy = collider.translation().y - position[1]
      const dz = collider.translation().z - position[2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const falloff = Math.max(0, 1 - dist / radius)
      const finalDamage = Math.round(damage * falloff)

      if (finalDamage > 0) {
        entity.takeDamage(finalDamage)
      }
    }
    return true // continue iterating
  })
}
