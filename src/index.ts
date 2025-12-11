import { Reactive, reactive, watch, type WatchCallback, type WatchOptions } from 'vue'
export type StateMethod = (store: any, ...args: any[]) => any
type StateTree = Record<PropertyKey, any>
type StateModifer = (...change: Partial<StateTree>[]) => SimpleStore
export type StateUpdateFn = (state: StateTree) => Partial<StateTree>
export type StateUpdateArg = Partial<StateTree> | StateUpdateFn
type StateHelpers = {
  $reset: () => StateTree
  $assign: StateModifer
  $update: (change: StateUpdateArg) => SimpleStore
  $get: <K extends keyof StateTree>(key: K) => StateTree[K]
  $set: <K extends keyof StateTree>(key: K, value: StateTree[K]) => SimpleStore
  $keys: () => PropertyKey[]
  $subscribe: (callback: WatchCallback<any, any>, options?: WatchOptions) => void
}
export type Initializer<T = StateTree> = () => T
interface ActionsOrGetters {
  readonly [key: string]: StateMethod | any
}
export type SimpleStore<S = StateTree & ActionsOrGetters> = Reactive<
  (S extends () => infer T
    ? T extends { getters: (state: any) => infer G }
      ? Omit<T, 'getters'> &
          G & {
            [K in keyof T]: T[K] extends (store: any, ...args: infer A) => infer R
              ? (...args: A) => R
              : T[K]
          }
      : T & {
          [K in keyof T]: T[K] extends (store: any, ...args: infer A) => infer R
            ? (...args: A) => R
            : T[K]
        }
    : S) &
    StateHelpers
>
const excludes = ['$reset', '$update', '$get', '$set', '$assign', '$subscribe', 'getters']
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
  const base = (initializer as Function)()
  if (!isPlainObject(base)) throw `initializer must return a plain object`
  const baseDescriptors = getOwnPropertyDescriptors(base)
  const keySet: Set<PropertyKey> = new Set()
  const template = (() => {
    const mutable = writable(baseDescriptors)
    Object.keys(mutable).forEach((key) => keySet.add(key))
    return mutable
  })()
  function initialState(): StateTree {
    return cloneDeep(template)
  }
  const state = reactive(initialState()) as unknown as SimpleStore
  function $keys() {
    return [...keySet]
  }
  const _assign = Object.assign
  const assign = (...args: PartialStateTree) => _assign(state, ...args)
  const reset = () => assign(initialState())
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
  const subscribe = (callback: WatchCallback<any, any>, options?: WatchOptions) => {
    return watch(
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
  }
  const descriptors: { [x: string]: PropertyDescriptor } = {
    $assign: descriptor(assign),
    $update: descriptor(update),
    $set: descriptor(set),
    $get: descriptor(get),
    $reset: descriptor(reset),
    $keys: descriptor($keys),
    $subscribe: descriptor(subscribe),
  }
  const d1 = readonly(baseDescriptors, caller)
  Object.defineProperties(state, _assign(d1, descriptors))

  if (baseDescriptors.getters && typeof baseDescriptors.getters.value === 'function') {
    const getters = baseDescriptors.getters.value
    const result = getters(state)
    if (isPlainObject(result)) {
      Object.defineProperties(state, extractGetters(result))
    }
  }
  return state as unknown as SimpleStore<T>
}

function extractGetters(getters: any): any {
  const descriptors = getOwnPropertyDescriptors(getters)
  const result: { [x: string]: PropertyDescriptor } = {}
  for (const key in descriptors) {
    const d = descriptors[key]
    if (typeof d.value === 'function') {
      console.warn(
        `[vue-simple-state] Getter "${key}" is a function. Functions should be defined at the root level of the initializer, not inside "getters".`,
      )
      continue
    }
    result[key] = descriptor({ get: d.get })
  }
  return result
}

function cloneDeep<T>(source: T): T {
  if (source === null || typeof source !== 'object') {
    return source
  }
  if (Array.isArray(source)) {
    return source.map((item) => cloneDeep(item)) as any
  }
  if (source instanceof Date) {
    return new Date(source.getTime()) as any
  }
  if (source instanceof RegExp) {
    return new RegExp(source) as any
  }
  const target = {} as any
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = cloneDeep((source as any)[key])
    }
  }
  return target
}
