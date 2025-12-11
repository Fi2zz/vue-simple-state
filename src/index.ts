import {
  Reactive,
  reactive,
  watch,
  type WatchCallback,
  type WatchOptions,
  EffectScope,
  effectScope,
  getCurrentScope,
} from 'vue'
export type StateMethod = (store: any, ...args: any[]) => any
type StateTree = Record<PropertyKey, any>
type StateModifer = (...change: Partial<StateTree>[]) => SimpleStore
export type StateUpdateFn = (state: StateTree) => Partial<StateTree>
export type StateUpdateArg = Partial<StateTree> | StateUpdateFn
export type SubscribeOptions = WatchOptions & {
  detached?: boolean
}

type StateHelpers = {
  $reset: () => void
  $assign: StateModifer
  $update: (change: StateUpdateArg) => SimpleStore
  $get: <K extends keyof StateTree>(key: K) => StateTree[K]
  $set: <K extends keyof StateTree>(key: K, value: StateTree[K]) => SimpleStore
  $keys: () => PropertyKey[]
  $subscribe: (callback: WatchCallback<any, any>, options?: SubscribeOptions) => () => void
  $dispose: () => void
}
export type Initializer<T = StateTree> = () => T
interface ActionsOrGettersTree {
  readonly [key: string]: StateMethod | any
}
export type SimpleStore<S = StateTree & ActionsOrGettersTree> = Reactive<
  (S extends () => infer T
    ? T & {
        [K in keyof T]: T[K] extends (store: any, ...args: infer A) => infer R
          ? (...args: A) => R
          : T[K]
      }
    : S) &
    StateHelpers
>
const excludes = ['$reset', '$update', '$get', '$set', '$assign', '$subscribe', '$dispose']
const getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors

function writableValue(d: PropertyDescriptor) {
  return d.writable && d.enumerable && d.configurable && typeof d.value !== 'function'
}
function writable(object: object) {
  const _m: any = {}
  for (const [key, d] of Object.entries(object)) {
    if (excludes.includes(key)) continue
    if (writableValue(d)) {
      _m[key] = d.value
    }
  }
  return _m
}
function readonly(object: object, caller?: any) {
  const pairs: { [x: string]: PropertyDescriptor } = {}
  for (const [key, d] of Object.entries(object)) {
    if (excludes.includes(key)) continue
    if (writableValue(d)) continue
    if (typeof d.value === 'function') {
      pairs[key] = descriptor({ value: caller(d.value) })
    }
    if (typeof d.get !== 'undefined') pairs[key] = descriptor(d)
  }

  return pairs
}

function descriptor(input: PropertyDescriptor['value']): PropertyDescriptor
function descriptor(input: PropertyDescriptor): PropertyDescriptor
function descriptor(config: PropertyDescriptor) {
  if (typeof config == 'function')
    return {
      enumerable: true,
      configurable: false,
      value: config,
    }
  if (config.value) {
    return {
      writable: false,
      enumerable: true,
      configurable: false,
      value: config.value,
    }
  }
  return {
    enumerable: true,
    configurable: false,
    get: config?.get,
    set: config?.set,
  }
}

type PartialState = Partial<StateTree>
type PartialStateTree = Partial<StateTree>[]

function isPlainObject(obj: any) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

export function simpleStore<T extends Initializer>(initializer: T): SimpleStore<T> {
  if (typeof initializer !== 'function') throw `initializer must be a function`

  const scope = effectScope(true)
  let stateScope: EffectScope

  function getBaseState() {
    if (stateScope) stateScope.stop()
    stateScope = effectScope()
    return stateScope.run(() => {
      const base = (initializer as Function)()
      if (!isPlainObject(base)) throw `initializer must return a plain object`
      return base
    })!
  }

  const base = scope.run(() => getBaseState())!
  const baseDescriptors = getOwnPropertyDescriptors(base)
  const keySet: Set<PropertyKey> = new Set()
  const mutable = writable(baseDescriptors)
  Object.keys(mutable).forEach((key) => keySet.add(key))

  const state = reactive(base) as unknown as SimpleStore

  function $keys() {
    return [...keySet]
  }
  const _assign = Object.assign
  const assign = (...args: PartialStateTree) => _assign(state, ...args)
  const reset = () => {
    const fresh = scope.run(() => getBaseState())!
    const data: StateTree = {}
    // Extract only data properties (including Refs), ignoring functions and getters definition
    for (const key in fresh) {
      if (excludes.includes(key)) continue
      const value = fresh[key]
      if (typeof value === 'function') continue
      data[key] = value
    }
    assign(data)
  }

  const dispose = () => {
    scope.stop()
    subscriptions.forEach((sub) => sub())
    subscriptions.length = 0
  }

  const update = (p: StateUpdateArg) => {
    if (typeof p === 'function') {
      const part = p(state)
      if (!isPlainObject(part)) throw new Error('Update function must return a plain object')
      return assign(part)
    }
    return assign(p)
  }
  function set(key: PropertyKey, value: any) {
    return assign({ [key]: value } as PartialState)
  }
  function get(key: PropertyKey) {
    return (state as StateTree)[key]
  }
  const caller =
    (fn: StateMethod) =>
    (...args: any[]) => {
      return fn.apply(null, [state, ...args])
    }

  const subscriptions: (() => void)[] = []

  const subscribe = (callback: WatchCallback<any, any>, options?: SubscribeOptions) => {
    const detached = options?.detached

    const runWatch = () =>
      watch(
        () => {
          const raw = state as StateTree
          const data: StateTree = {}
          for (const key in raw) {
            if (
              !excludes.includes(key as string) &&
              Object.prototype.hasOwnProperty.call(raw, key) &&
              typeof raw[key] !== 'function'
            ) {
              data[key] = raw[key]
            }
          }
          return data
        },
        callback,
        { deep: true, flush: 'sync', ...options },
      )

    let stop: () => void

    if (detached || !getCurrentScope()) {
      stop = scope.run(runWatch)!
    } else {
      stop = runWatch()
    }

    subscriptions.push(stop)

    const cleanup = () => {
      stop()
      const idx = subscriptions.indexOf(stop)
      if (idx > -1) subscriptions.splice(idx, 1)
    }

    return cleanup
  }
  const descriptors: { [x: string]: PropertyDescriptor } = {
    $assign: descriptor(assign),
    $update: descriptor(update),
    $set: descriptor(set),
    $get: descriptor(get),
    $reset: descriptor(reset),
    $keys: descriptor($keys),
    $subscribe: descriptor(subscribe),
    $dispose: descriptor(dispose),
  }
  const d1 = readonly(baseDescriptors, caller)
  Object.defineProperties(state, _assign(d1, descriptors))
  return state as unknown as SimpleStore<T>
}
