# Vue Simple State

A simple, lightweight state management library for Vue 3 using the Composition API.

## Features

- 🚀 Lightweight and fast
- 📦 TypeScript support out of the box
- 🔧 Simple API based on Vue 3 Reactive
- 🔄 Automatic state reset support
- 🛠 Built-in helper methods ($reset, $patch, etc.)

## Installation

```bash
npm install vue-simple-state
# or
pnpm add vue-simple-state
# or
yarn add vue-simple-state
```

## Usage

```typescript
import { simpleStore } from 'vue-simple-state'
import { ref, computed } from 'vue'

const store = simpleStore(() => {
  // 1. Use Refs for state
  const count = ref(0)
  const user = { name: 'John', lastName: 'Doe' } // Plain objects are also fine

  // 2. Use Computed for derived state
  const double = computed(() => count.value * 2)
  const fullName = computed(() => `${user.name} ${user.lastName}`)

  // 3. Define Actions
  function increment() {
    count.value++
  }

  return {
    count,
    user,
    double,
    fullName,
    increment,
  }
})

// 4. Use store
store.increment()
console.log(store.double) // 2 (Auto-unwrapped)

// 4. Use helper methods
store.$reset() // Reset to initial state
store.$update({ count: 10 }) // Update state with object
store.$update((state) => ({ count: state.count + 1 })) // Update state with function

// 5. Subscribe to changes
store.$subscribe((newState, oldState) => {
  console.log('State changed:', newState)
})
```

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
