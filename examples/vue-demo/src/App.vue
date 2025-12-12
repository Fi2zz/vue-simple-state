<script setup lang="ts">
import { simpleStore } from 'vue-simple-state'
import { computed } from 'vue'
import { ref } from 'vue'

// Define state initializer
function initialState() {
  const count = ref(0)

  const user = ref({
    name: 'Vue User',
    role: 'developer',
  })
  return {
    count,
    user,
    todos: [] as string[],
    hello() {},
    $reset() {
      count.value = 0
    },
  }
}

// Create store
const store = simpleStore(initialState)

// Use store
const increment = () => {
  store.count++
}

const decrement = () => {
  store.count--
}

const reset = () => {
  store.$reset()
}

const updateName = (e: Event) => {
  const target = e.target as HTMLInputElement
  store.user.name = target.value

  // store.$update({})
}

const addTodo = () => {
  const todo = `Task ${store.todos.length + 1}`
  store.todos.push(todo)
}

// Computed property based on store state
const doubleCount = computed(() => store.count * 2)
</script>

<template>
  <div class="container">
    <h1>Vue Simple State Demo</h1>

    <div class="card">
      <h2>Counter</h2>
      <p>Count: {{ store.count }}</p>
      <p>Double Count: {{ doubleCount }}</p>
      <div class="actions">
        <button @click="increment">+</button>
        <button @click="decrement">-</button>
        <button @click="reset">Reset</button>
      </div>
    </div>

    <div class="card">
      <h2>User Info</h2>
      <p>Name: {{ store.user.name }}</p>
      <p>Role: {{ store.user.role }}</p>
      <input :value="store.user.name" @input="updateName" placeholder="Edit name" />
    </div>

    <div class="card">
      <h2>Todos</h2>
      <button @click="addTodo">Add Todo</button>
      <ul>
        <li v-for="(todo, index) in store.todos" :key="index">{{ todo }}</li>
      </ul>
    </div>

    <div class="debug">
      <h3>Store State (Debug)</h3>
      <pre>{{ store }}</pre>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  background-color: #f9f9f9;
}

.actions button {
  margin-right: 10px;
  padding: 5px 15px;
  cursor: pointer;
}

input {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.debug {
  margin-top: 40px;
  background: #333;
  color: #fff;
  padding: 20px;
  border-radius: 8px;
  overflow: auto;
}

h1 {
  text-align: center;
  color: #2c3e50;
}
</style>
