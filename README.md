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

Detailed API documentation is available in [docs/api/README.md](docs/api/README.md).

### Core Methods

- **`$patch(partialStateOrMutator)`**: Update state.
- **`$reset()`**: Reset state (requires implementation).
- **`$state`**: Access or replace the entire state object.
- **`$dispose()`**: Stop the store's effect scope.

### Utilities

- **`storeToRefs(store)`**: Destructures state while preserving reactivity.

## Persistence

Use Vue's native `watch` to subscribe to changes.

```typescript
import { watch } from 'vue'

watch(
  () => store.$state,
  (state) => {
    localStorage.setItem('myState', JSON.stringify(state))
  },
  { deep: true },
)
```

## Development

### Scripts

- `pnpm build`: Build the library
- `pnpm test`: Run tests (Vitest)
- `pnpm test:coverage`: Run tests with coverage
- `pnpm lint`: Lint code
- `pnpm format`: Format code

## License

MIT
