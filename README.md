# vue-simple-state

A lightweight, Pinia-like state management library for Vue 3. It provides a simple Setup Store pattern with built-in persistence support and essential helpers.

## Features

- 📦 **Lightweight**: Zero dependencies (only Vue).
- ⚡ **Reactive**: Built on Vue 3's Reactivity API.
- 🛠 **Setup Stores**: Define stores using standard Vue Composition API.
- 🔌 **Pinia Compatible API**: Familiar methods like `$patch`, `$reset`, `$state`.
- 🧩 **No Boilerplate**: No actions/mutations separation. Just functions.
- 🔧 **TypeScript**: First-class type support.

## Installation

```bash
npm install vue-simple-state
# or
pnpm add vue-simple-state
```

## Usage

### 1. Define a Store

`vue-simple-state` uses the **Setup Store** pattern. You define state using `ref` or `reactive`, and actions as regular functions.

```typescript
import { simpleStore } from 'vue-simple-state'
import { ref, computed } from 'vue'

export const useCounterStore = simpleStore(() => {
  // State
  const count = ref(0)
  const name = ref('Eduardo')

  // Getters
  const doubleCount = computed(() => count.value * 2)

  // Actions
  function increment() {
    count.value++
  }

  function $reset() {
    count.value = 0
  }

  return { count, name, doubleCount, increment, $reset }
})
```

### 2. Use in Component

```vue
<script setup>
import { useCounterStore } from './store'
import { storeToRefs } from 'vue-simple-state'

const store = useCounterStore

// Destructuring with reactivity
const { count, doubleCount } = storeToRefs(store)

function add() {
  store.increment()
}
</script>

<template>
  <button @click="add">Count: {{ count }} (Double: {{ doubleCount }})</button>
</template>
```

## API Reference

### Core Methods

- **`$patch(partialStateOrMutator)`**: Update state.

  ```typescript
  // Object style
  store.$patch({ count: store.count + 1 })

  // Function style (Mutation)
  store.$patch((state) => {
    state.items.push({ name: 'shoes', quantity: 1 })
    state.hasChanged = true
  })
  ```

- **`$reset()`**: Reset state.

  > **Note**: You must implement the `$reset` function in your setup store. `vue-simple-state` calls your implementation.

- **`$state`**: Access or replace the entire state object (plain object).

  ```typescript
  // Get snapshot
  console.log(store.$state)

  // Replace state
  store.$state = { count: 10, name: 'Alice' }
  ```

- **`$dispose()`**: Stop the store's effect scope. Useful for cleanup.

### Utilities

- **`storeToRefs(store)`**:
  Creates an object of references with all the state, getters, and plugin-added state properties of the store. Similar to `toRefs` but ignores methods.

## Persistence / Subscribing

Use Vue's native `watch` to subscribe to changes.

```typescript
import { watch } from 'vue'

watch(
  () => store.$state,
  (state) => {
    localStorage.setItem('piniaState', JSON.stringify(state))
  },
  { deep: true },
)
```

## License

MIT

## Development

### Project Structure

- `src/`: Core library source code
- `examples/`: Example applications
- `dist/`: Build output

### Scripts

- `pnpm dev`: Start the example application (requires manual cd to examples/vue-demo and run dev currently, or use `vite build --watch` for lib)
- `pnpm build`: Build the library
- `pnpm lint`: Lint code
- `pnpm format`: Format code

### Running the Example

To run the Vue 3 example project:

```bash
cd examples/vue-demo
pnpm dev
```

The example demonstrates:

- Basic state management (Counter)
- Nested object updates (User Info)
- Array manipulation (Todos)
- Helper methods usage ($reset)
