<script setup lang="ts">
import { sileo } from './core/sileo';
import Toaster from './components/Toaster.vue';

const testPromise = () => sileo.promise(
  new Promise(resolve => setTimeout(resolve, 2000)),
  {
    loading: { title: 'Guardando...' },
    success: { title: 'Guardado', description: 'Todo ok' },
    error: { title: 'Error', description: 'Algo salió mal' },
  }
)
</script>

<template>
  <Toaster position="bottom-center" theme="light"  />

  <div style="padding: 2rem; display: flex; gap: 1rem;">
    <button @click="sileo.success({ title: 'Guardado', description: 'Todo ok' })">
      Success
    </button>
    <button @click="sileo.error({ title: 'Error', description: 'Algo salió mal' })">
      Error
    </button>
    <button @click="testPromise">
      Promise
    </button>
  </div>
</template>