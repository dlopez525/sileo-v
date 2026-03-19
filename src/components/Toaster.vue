<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useToastStore, type SileoToast } from '../core/sileo';
import { DEFAULT_POSITION, THEME_FILLS } from '../constants';
import type { SileoPosition } from '../types';
import Toast from './Toast.vue';

const props = withDefaults(defineProps<{
    position?: SileoPosition;
    theme?: 'light' | 'dark' | 'system';
    offset?: number | string | Partial<Record<'top' | 'right' | 'bottom' | 'left', number | string>>;
}>(), {
    position: DEFAULT_POSITION,
});

const { store, dismissToast } = useToastStore();

/* --------------------------------- State ---------------------------------- */
const toasts = ref<SileoToast[]>([...store.toasts]);
const activeId = ref<string | undefined>();
const isHovering = ref(false);
const timers = new Map<string, ReturnType<typeof setTimeout>>();

/* --------------------------------- Theme ---------------------------------- */
const resolvedTheme = computed<'light' | 'dark'>(() => {
    if (props.theme === 'light' || props.theme === 'dark') return props.theme;
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
});

const fill = computed(() =>
    props.theme ? THEME_FILLS[resolvedTheme.value] : '#FFFFFF'
)

/* --------------------------------- Store ---------------------------------- */
const unsubscribe = store.subscribe((next) => {
    toasts.value = next.map(t => ({ ...t }));
});

onUnmounted(() => {
    unsubscribe();
    for (const t of timers.values()) clearTimeout(t);
    timers.clear();
});

/* --------------------------------- Timers --------------------------------- */
const timeoutKey = (t: SileoToast) => `${t.id}:${t.instanceId}`;

const scheduleAll = (items: SileoToast[]) => {
    if (isHovering.value) return;
    for (const item of items) {
        if (item.exiting) continue;
        const key = timeoutKey(item);
        if (timers.has(key)) continue;
        if (item.duration === null || item.duration === undefined) continue;
        if (item.duration <= 0) continue;
        timers.set(key, setTimeout(() => dismissToast(item.id), item.duration))
    }
};

const clearAllTimers = () => {
    for (const t of timers.values()) clearTimeout(t);
    timers.clear();
};

watch(toasts, (next) => {
    const toastKeys = new Set(next.map(timeoutKey));
    for (const [key, timer] of timers.entries()) {
        if (!toastKeys.has(key)) {
            clearTimeout(timer)
            timers.delete(key)
        }
    }
    for (const item of next) {
        timeoutKey(item)
    }
    scheduleAll(next);
}, { immediate: true, deep: true });


/* --------------------------------- Latest --------------------------------- */
const latest = computed(() => {
    for (let i = toasts.value.length - 1; i >= 0; i--) {
        if (!toasts.value[i].exiting) return toasts.value[i].id;
    }
    return undefined;
});

watch(latest, (val) => { activeId.value = val; });

/* -------------------------------- Grouped --------------------------------- */
const activePositions = computed(() => {
    const map = new Map<SileoPosition, SileoToast[]>();
    for (const t of toasts.value) {
        const pos = t.position ?? props.position;
        const arr = map.get(pos);
        if (arr) arr.push(t);
        else map.set(pos, [t]);
    }
    return map;
});

/* -------------------------------- Helpers --------------------------------- */
const pillAlign = (pos: SileoPosition) =>
    pos.includes('right') ? 'right' : pos.includes('center') ? 'center' : 'left'

const expandDir = (pos: SileoPosition) =>
    pos.startsWith('top') ? 'bottom' : 'top';

const getViewportStyle = (pos: SileoPosition) => {
    if (!props.offset) return undefined;
    const o = typeof props.offset === 'object'
        ? props.offset
        : { top: props.offset, right: props.offset, bottom: props.offset, left: props.offset };
    const px = (v: number | string) => typeof v === 'number' ? `${v}px` : v;
    const s: Record<string, string> = {};
    if (pos.startsWith('top') && o.top) s.top = px(o.top);
    if (pos.startsWith('bottom') && o.bottom) s.bottom = px(o.bottom);
    if (pos.endsWith('left') && o.left) s.left = px(o.left);
    if (pos.endsWith('right') && o.right) s.right = px(o.right);
    return s;
};

/* -------------------------------- Handlers -------------------------------- */
const onMouseEnter = (toastId: string) => {
    activeId.value = toastId;
    if (isHovering.value) return;
    isHovering.value = true;
    clearAllTimers();
};

const onMouseLeave = () => {
    if (!isHovering.value) return;
    isHovering.value = false;
    activeId.value = latest.value;
    scheduleAll(toasts.value);
};

watch(() => props.position, (val) => {
    store.position = val
}, { immediate: true })
</script>

<template>
    <template v-for="[pos, items] in activePositions" :key="pos">
        <section data-sileo-viewport :data-position="pos" :data-theme="theme ? resolvedTheme : undefined"
            aria-live="polite" :style="getViewportStyle(pos)">
            <Toast v-for="item in items" :key="item.id" :toast="item" :position="pillAlign(pos)"
                :expand="expandDir(pos)" :fill="item.fill ?? fill ?? '#FFFFFF'"
                :can-expand="activeId === undefined || activeId === item.id" @mouseenter="onMouseEnter(item.id)"
                @mouseleave="onMouseLeave" @dismiss="dismissToast(item.id)" />
        </section>
    </template>
</template>