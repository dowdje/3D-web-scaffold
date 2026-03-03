import { useEffect, useRef } from 'react'

/**
 * Lightweight entity registry mapping Rapier collider handles to game entities.
 * Used by hitscan and explosion systems to resolve physics hits to game objects.
 */
const entityMap = new Map()

export function registerEntity(colliderHandle, entity) {
  entityMap.set(colliderHandle, entity)
}

export function unregisterEntity(colliderHandle) {
  entityMap.delete(colliderHandle)
}

export function getEntityByCollider(colliderHandle) {
  return entityMap.get(colliderHandle)
}

/**
 * Hook for components to register/unregister with the entity registry.
 * @param {React.RefObject} rigidBodyRef - Ref to the RigidBody
 * @param {object} entityInfo - { type: string, id: string|number, takeDamage: fn }
 */
export function useEntityRegistry(rigidBodyRef, entityInfo) {
  const infoRef = useRef(entityInfo)
  infoRef.current = entityInfo

  useEffect(() => {
    // Small delay to ensure physics body is initialized
    const timer = setTimeout(() => {
      const rb = rigidBodyRef.current
      if (!rb) return

      // Register all colliders on this rigid body
      const numColliders = rb.numColliders()
      const handles = []
      for (let i = 0; i < numColliders; i++) {
        const collider = rb.collider(i)
        const handle = collider.handle
        handles.push(handle)
        registerEntity(handle, infoRef.current)
      }

      // Store handles for cleanup
      infoRef._handles = handles
    }, 50)

    return () => {
      clearTimeout(timer)
      const handles = infoRef._handles || []
      for (const handle of handles) {
        unregisterEntity(handle)
      }
    }
  }, [rigidBodyRef])
}
