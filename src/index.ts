import { EffectScope, effectScope, isReactive, isRef, Reactive, reactive, toRef, ToRef } from 'vue'

export type StateMethod = (...args: any[]) => any
type StateTree = Record<PropertyKey, any>
type PartialStates = Partial<StateTree>[]
export type StateUpdateFn = (state: StateTree) => Partial<StateTree>
export type StateUpdateArg = Partial<StateTree> | StateUpdateFn
export type StatePatchFn = (state: StateTree) => void
export type StatePatchArg = Partial<StateTree> | StatePatchFn
interface StoreHelpers {
  $id: string
  $state: StateTree
  $reset: () => void
  $assign: (...change: Partial<StateTree>[]) => MiniStore
  $patch: (partialStateOrMutator: StatePatchArg) => void
  $update: (change: StateUpdateArg) => MiniStore
  $dispose: () => void
  [key: string]: any
}
export type SetupStore<T = StateTree> = () => T
type StoreState<SS> = SS extends () => infer S ? S : never
export type MiniStore<SS = SetupStore> = Reactive<StoreState<SS> & StoreHelpers>

let uid = 0
export function storeToRefs<SS extends MiniStore>(store: SS) {
  const refs = {} as any
  for (const key in store) {
    if (key === '$id' || key === '$state') continue
    const value = store[key]
    if (isRef(value) || isReactive(value)) {
      refs[key] = toRef(store, key)
    } else if (!isFunction(value)) {
      refs[key] = toRef(store, key)
    }
  }
  return refs as {
    [K in keyof SS]: SS[K] extends Function ? never : ToRef<SS[K]>
  }
}

const _toString = Object.prototype.toString
const _assign = Object.assign
const getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors
const hasOwnProperty = Object.prototype.hasOwnProperty
const isFunction = (val: any): val is Function => typeof val === 'function'
const isPlainObject = (obj: any) => _toString.call(obj) === '[object Object]'
function makeActionsDescriptors(setupResult: object) {
  const object = getOwnPropertyDescriptors(setupResult)
  const pairs: { [x: string]: PropertyDescriptor } = {}
  for (const [key, d] of Object.entries(object)) {
    if (!isFunction(d.value)) continue
    pairs[key] = makeDescriptor({ value: d.value })
  }
  return pairs
}

function makeDescriptor(config: PropertyDescriptor): PropertyDescriptor {
  const enumerable = 'enumerable' in config ? (config.enumerable ?? true) : true
  if (config.value) {
    return {
      writable: false,
      enumerable,
      configurable: true,
      value: config.value,
    }
  }
  return {
    enumerable,
    configurable: true,
    get: config?.get,
    set: config?.set,
  }
}

function stripFunctions(obj: StateTree): StateTree {
  if (isRef(obj)) return obj
  if (Array.isArray(obj)) return obj.map(stripFunctions)
  if (!isPlainObject(obj)) return obj
  const copy: any = {}
  for (const key in obj) {
    const value = obj[key as keyof typeof obj]
    if (isFunction(value)) continue
    copy[key] = stripFunctions(value)
  }
  return copy
}

export function createStore<T extends SetupStore>(setup: T): MiniStore<T> {
  if (!isFunction(setup)) throw `setup must be a function`
  const scope = effectScope(true)
  let stateScope: EffectScope
  let setupResult: any

  function getBaseState() {
    stateScope = effectScope()
    return stateScope.run(() => {
      setupResult = (setup as Function)()
      if (!isPlainObject(setupResult)) throw `setup must return a plain object`
      return stripFunctions(setupResult)
    })!
  }
  const base = (scope.run(() => getBaseState()) as unknown as StateTree)!
  // store id
  let id = setupResult['$id']
  if (!id) id = `simple-store-${uid++}`
  const state = reactive(base) as unknown as MiniStore
  const assign = (...args: PartialStates) => _assign(state, ...args)
  const defaultReset = () => {
    throw new Error(
      '[vue-simple-store] Store does not have a $reset method. Please implement "$reset" in your store initializer to support resetting.',
    )
  }
  const dispose = () => {
    stateScope.stop()
    scope.stop()
  }
  const update = (p: StateUpdateArg) => {
    if (isFunction(p)) {
      const part = p(state)
      if (!isPlainObject(part)) throw new Error('Update function must return a plain object')
      return assign(part)
    }
    return assign(p)
  }

  const patch = (valOrFn: StatePatchArg) => {
    if (isFunction(valOrFn)) valOrFn(state)
    else assign(valOrFn)
  }

  function getState() {
    // Return plain object snapshot
    const raw = state as StateTree
    const data: StateTree = {}
    for (const key in base) {
      if (key.startsWith('$')) continue
      if (hasOwnProperty.call(raw, key) && !isFunction(raw[key])) {
        data[key] = raw[key]
      }
    }
    return data
  }
  const setState = (val: StateTree) => assign(val)
  const actions = makeActionsDescriptors(setupResult)
  const descriptors: { [x: string]: PropertyDescriptor } = {
    $id: makeDescriptor({ get: () => id }),
    $state: makeDescriptor({ enumerable: false, get: getState, set: setState }),
    $assign: makeDescriptor({ value: assign }),
    $patch: makeDescriptor({ value: patch }),
    $update: makeDescriptor({ value: update }),
    $dispose: makeDescriptor({ value: dispose }),
    $reset: actions.$reset ?? makeDescriptor({ value: defaultReset }),
  }
  Object.defineProperties(state, _assign(actions, descriptors))
  return state as unknown as MiniStore<T>
}
