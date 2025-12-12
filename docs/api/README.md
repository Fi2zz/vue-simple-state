# API Reference

## `simpleStore`

Creates a reactive store using the Setup Store pattern.

**Signature:**

```typescript
function simpleStore<T>(setup: () => T): SimpleStore<T>
```

**Parameters:**

- `setup`: A function that defines the store's state, getters, and actions. It must return a plain object containing these definitions.

**Returns:**

- `SimpleStore<T>`: A reactive object containing the state, actions, and built-in helper methods.

**Example:**

```typescript
import { simpleStore } from 'vue-simple-store'
import { ref } from 'vue'

const useStore = simpleStore(() => {
  const count = ref(0)
  function increment() {
    count.value++
  }
  return { count, increment }
})
```

---

## `storeToRefs`

Destructures a store into a set of refs, preserving reactivity for state properties while ignoring methods. This is useful when you want to destructure the store in a component setup function.

**Signature:**

```typescript
function storeToRefs<SS extends SimpleStore>(store: SS): ToRefs<SS>
```

**Parameters:**

- `store`: The store instance to destructure.

**Returns:**

- An object where every state property of the store is converted to a Ref. Methods are excluded.

**Example:**

```typescript
import { storeToRefs } from 'vue-simple-store'

const store = useStore
const { count } = storeToRefs(store)
// count is a Ref<number>
```

---

## `SimpleStore` (Interface)

The type of the store instance returned by `simpleStore`. It is an intersection of the user-defined state/actions and the built-in `StoreHelpers`.

```typescript
type SimpleStore<SS> = Reactive<StoreState<SS> & StoreHelpers>
```

### Built-in Helpers

Every store instance comes with the following helper properties and methods:

#### `$id`

- **Type**: `string`
- **Description**: A unique identifier for the store. If not provided in the setup return, one is auto-generated.

#### `$state`

- **Type**: `StateTree` (Plain Object)
- **Description**: Access the entire state as a plain object. Writing to `$state` replaces the entire state (via `$patch`).
- **Example**:
  ```typescript
  console.log(store.$state) // { count: 0 }
  store.$state = { count: 1 }
  ```

#### `$patch`

- **Type**: `(partialStateOrMutator: Object | Function) => void`
- **Description**: Applies a state update. Can be passed an object to merge, or a function to mutate state directly.
- **Example**:
  ```typescript
  store.$patch({ count: 10 })
  store.$patch((state) => {
    state.count++
  })
  ```

#### `$update`

- **Type**: `(change: Object | Function) => SimpleStore`
- **Description**: Similar to `$patch` but designed for functional updates. If a function is passed, it must return the partial state object to merge.
- **Example**:
  ```typescript
  store.$update((state) => ({ count: state.count + 1 }))
  ```

#### `$reset`

- **Type**: `() => void`
- **Description**: Resets the store to its initial state.
- **Note**: You **must** implement a `$reset` function in your setup function for this to work. If not implemented, calling it will throw an error.

#### `$dispose`

- **Type**: `() => void`
- **Description**: Stops the effect scope associated with the store. This stops all internal watchers and effects.

#### `$assign`

- **Type**: `(...changes: Object[]) => SimpleStore`
- **Description**: Merges one or more objects into the state. Used internally by `$patch` and `$update`.

---
