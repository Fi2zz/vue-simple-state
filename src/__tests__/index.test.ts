import { describe, expect, it } from 'vitest'
import { computed, isRef, nextTick, reactive, ref, watch } from 'vue'
import { simpleStore, storeToRefs } from '../index'

describe('vue-simple-state', () => {
  describe('simpleStore', () => {
    it('should create a store with state and actions', () => {
      const useStore = simpleStore(() => {
        const count = ref(0)
        const increment = () => count.value++
        return { count, increment }
      })

      expect(useStore.count).toBe(0)
      useStore.increment()
      expect(useStore.count).toBe(1)
    })

    it('should support getters (computed)', () => {
      const useStore = simpleStore(() => {
        const count = ref(1)
        const double = computed(() => count.value * 2)
        return { count, double }
      })

      expect(useStore.double).toBe(2)
      useStore.count = 2
      expect(useStore.double).toBe(4)
    })

    it('should generate auto ID if not provided', () => {
      const store1 = simpleStore(() => ({}))
      const store2 = simpleStore(() => ({}))
      expect(store1.$id).toMatch(/^simple-store-\d+$/)
      expect(store2.$id).not.toBe(store1.$id)
    })

    it('should use custom ID if provided', () => {
      const store = simpleStore(() => ({ $id: 'custom-id', a: 1 }))
      expect(store.$id).toBe('custom-id')
      expect(store.a).toBe(1)
    })

    it('should throw if setup is not a function', () => {
      expect(() => simpleStore({} as any)).toThrow('setup must be a function')
    })

    it('should throw if setup returns non-plain object', () => {
      expect(() => simpleStore(() => null as any)).toThrow('setup must return a plain object')
    })

    it('should strip functions from state but keep them as actions', () => {
      const store = simpleStore(() => {
        const count = ref(0)
        const fn = () => {}
        return { count, fn }
      })

      // Action is available on store
      expect(typeof store.fn).toBe('function')

      // But not in $state
      expect(store.$state.fn).toBeUndefined()
      expect(store.$state.count).toBe(0)
    })
  })

  describe('Helpers', () => {
    it('$patch (object)', () => {
      const store = simpleStore(() => {
        const count = ref(0)
        const name = ref('a')
        return { count, name }
      })

      store.$patch({ count: 10 })
      expect(store.count).toBe(10)
      expect(store.name).toBe('a')
    })

    it('$patch (function)', () => {
      const store = simpleStore(() => {
        const count = ref(0)
        const list = ref<number[]>([])
        return { count, list }
      })

      store.$patch((state) => {
        state.count = 20
        state.list.push(1)
      })

      expect(store.count).toBe(20)
      expect(store.list).toEqual([1])
    })

    it('$update (object)', () => {
      const store = simpleStore(() => ({ a: 1 }))
      store.$update({ a: 2 })
      expect(store.a).toBe(2)
    })

    it('$update (function)', () => {
      const store = simpleStore(() => ({ a: 1 }))
      store.$update((state) => ({ a: state.a + 1 }))
      expect(store.a).toBe(2)
    })

    it('$update throw on invalid return', () => {
      const store = simpleStore(() => ({ a: 1 }))
      expect(() => store.$update(() => null as any)).toThrow(
        'Update function must return a plain object',
      )
    })

    it('$reset (default throw)', () => {
      const store = simpleStore(() => ({ a: 1 }))
      expect(() => store.$reset()).toThrow('Store does not have a $reset method')
    })

    it('$reset (custom)', () => {
      const store = simpleStore(() => {
        const a = ref(1)
        const $reset = () => {
          a.value = 0
        }
        return { a, $reset }
      })

      store.a = 5
      store.$reset()
      expect(store.a).toBe(0)
    })

    it('$dispose', () => {
      let triggered = 0
      const store = simpleStore(() => {
        const count = ref(0)
        watch(count, () => triggered++)
        return { count }
      })

      store.count++
      // Wait for watch (pre-flush)
      return nextTick()
        .then(() => {
          expect(triggered).toBe(1)
          store.$dispose()
          store.count++
          return nextTick()
        })
        .then(() => {
          expect(triggered).toBe(1) // Should not trigger again
        })
    })

    it('$state (getter)', () => {
      const store = simpleStore(() => {
        const a = ref(1)
        const b = () => {}
        return { a, b }
      })
      expect(store.$state).toEqual({ a: 1 })
    })

    it('$state (setter)', () => {
      const store = simpleStore(() => {
        const a = ref(1)
        return { a }
      })
      store.$state = { a: 2 }
      expect(store.a).toBe(2)
    })

    it('$assign', () => {
      const store = simpleStore(() => ({ a: 1, b: 2 }))
      store.$assign({ a: 10 })
      expect(store.a).toBe(10)
      expect(store.b).toBe(2)
    })
  })

  describe('Utilities', () => {
    it('storeToRefs', () => {
      const store = simpleStore(() => {
        const count = ref(0)
        const name = reactive({ first: 'John' })
        const fn = () => {}
        return { count, name, fn }
      })

      const refs = storeToRefs(store)
      expect(isRef(refs.count)).toBe(true)
      expect(isRef(refs.name)).toBe(true)
      expect(refs.fn).toBeUndefined()
      expect(refs.count.value).toBe(0)

      // Internal props
      expect((refs as any).$id).toBeUndefined()
      expect((refs as any).$state).toBeUndefined()
    })
  })
})
