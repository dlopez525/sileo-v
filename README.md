# sileo-vue

A Vue 3 port of [sileo](https://github.com/hiaaryan/sileo) — SVG morphing toast notifications with spring physics and a minimal API. Beautiful by default, no configuration required.

[![npm version](https://img.shields.io/npm/v/sileo-vue)](https://www.npmjs.com/package/sileo-vue)
[![license](https://img.shields.io/npm/l/sileo-vue)](https://github.com/dlopez525/sileo-vue/blob/main/LICENSE)

---

## Installation

```bash
npm install sileo-vue motion-v
# or
pnpm add sileo-vue motion-v
```

## Quick Setup

Add `<Toaster />` to your app's root layout, then call `sileo` from anywhere.

```vue
<!-- App.vue -->
<script setup>
import { Toaster } from 'sileo-vue'
import 'sileo-vue/style.css'
</script>

<template>
  <Toaster position="top-right" theme="light" />
  <RouterView />
</template>
```

## Fire a Toast

```ts
import { sileo } from 'sileo-vue'

sileo.success({ title: 'Saved' })
sileo.error({ title: 'Error', description: 'Something went wrong' })
sileo.warning({ title: 'Warning' })
sileo.info({ title: 'Info' })
sileo.action({ title: 'Action', button: { title: 'Undo', onClick: () => {} } })
```

## Promise Toast

Chain loading, success, and error states from a single promise.

```ts
sileo.promise(fetchData(), {
  loading: { title: 'Loading...' },
  success: (data) => ({ title: `Done! Got ${data.length} items` }),
  error: (err) => ({ title: 'Failed', description: err.message }),
})
```

The `promise` method returns the original promise so you can chain further.

## Toaster Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `SileoPosition` | `"top-right"` | Default position for toasts |
| `theme` | `"light" \| "dark" \| "system"` | — | Controls toast fill color |
| `offset` | `number \| string \| object` | — | Custom viewport offset |

Available positions: `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`.

## sileo API

| Method | Description |
|--------|-------------|
| `sileo.success(options)` | Green success toast |
| `sileo.error(options)` | Red error toast |
| `sileo.warning(options)` | Amber warning toast |
| `sileo.info(options)` | Blue info toast |
| `sileo.action(options)` | Toast with an action button |
| `sileo.show(options)` | Generic toast |
| `sileo.promise(promise, opts)` | Loading → success/error flow |
| `sileo.dismiss(id)` | Dismiss a specific toast by id |
| `sileo.clear(position?)` | Clear all toasts or by position |

All methods except `promise`, `dismiss` and `clear` return the toast `id` as a string.

## SileoOptions

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | — | Toast heading |
| `description` | `string \| Component` | — | Body content |
| `position` | `SileoPosition` | Toaster default | Override position per toast |
| `duration` | `number \| null` | `6000` | Auto-dismiss in ms. `null` = sticky |
| `icon` | `Component \| null` | — | Custom icon in the badge |
| `fill` | `string` | `"#FFFFFF"` | SVG fill color |
| `roundness` | `number` | `16` | Border radius in pixels |
| `autopilot` | `boolean \| object` | `true` | Auto expand/collapse timing |
| `button` | `SileoButton` | — | Action button config |
| `styles` | `SileoStyles` | — | Class overrides for sub-elements |

## Credits

This is a Vue 3 port of [sileo](https://github.com/hiaaryan/sileo) by [@hiaaryan](https://github.com/hiaaryan), licensed under MIT.

## License

MIT — © [dlopez525](https://github.com/dlopez525)