<script setup lang="ts">
import type { SileoState } from '../types'

defineProps<{ state: SileoState }>()
</script>

<template>
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        :data-sileo-icon="state === 'loading' ? 'spin' : undefined">
        <!-- success -->
        <template v-if="state === 'success'">
            <title>Check</title>
            <path d="M20 6 9 17l-5-5" />
        </template>

        <!-- error -->
        <template v-else-if="state === 'error'">
            <title>X</title>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </template>

        <!-- warning -->
        <template v-else-if="state === 'warning'">
            <title>Circle Alert</title>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
        </template>

        <!-- info -->
        <template v-else-if="state === 'info'">
            <title>Life Buoy</title>
            <circle cx="12" cy="12" r="10" />
            <path d="m4.93 4.93 4.24 4.24" />
            <path d="m14.83 9.17 4.24-4.24" />
            <path d="m14.83 14.83 4.24 4.24" />
            <path d="m9.17 14.83-4.24 4.24" />
            <circle cx="12" cy="12" r="4" />
        </template>

        <!-- action -->
        <template v-else-if="state === 'action'">
            <title>Arrow Right</title>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </template>

        <!-- loading -->
        <template v-else-if="state === 'loading'">
            <title>Loader</title>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </template>
    </svg>
</template>