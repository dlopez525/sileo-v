<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import { motion } from 'motion-v';
import type { SileoToast } from '../core/sileo';
import {
    BLUR_RATIO,
    DEFAULT_ROUNDNESS,
    HEADER_EXIT_MS,
    HEIGHT,
    MIN_EXPAND_RATIO,
    PILL_PADDING,
    SPRING,
    WIDTH,
} from '../constants';
import SileoIcon from './SileoIcon.vue';

const MotionRect = motion.create('rect')

/* ---------------------------------- Props --------------------------------- */
const props = withDefaults(defineProps<{
    toast: SileoToast;
    position?: 'left' | 'center' | 'right';
    expand?: 'top' | 'bottom';
    fill?: string;
    canExpand?: boolean;
}>(), {
    position: 'left',
    expand: 'bottom',
    fill: '#FFFFFF',
    canExpand: true,
});

const emit = defineEmits<{ dismiss: [] }>();

/* ---------------------------------- Refs ---------------------------------- */
const buttonRef = useTemplateRef<HTMLButtonElement>('buttonRef');
const headerRef = useTemplateRef<HTMLDivElement>('headerRef');
const innerRef = useTemplateRef<HTMLDivElement>('innerRef');
const contentRef = useTemplateRef<HTMLDivElement>('contentRef');

/* ---------------------------------- State --------------------------------- */
const ready = ref(false);
const isExpanded = ref(false);
const pillWidth = ref(0);
const contentHeight = ref(0);

/* ---------------------------- Header morphing ----------------------------- */
interface HeaderLayer {
    key: string;
    state: typeof props.toast.state;
    title: string | undefined;
}

const headerKey = computed(() => `${props.toast.state}-${props.toast.title}`);

const currentLayer = ref<HeaderLayer>({
    key: headerKey.value,
    state: props.toast.state,
    title: props.toast.title,
});
const prevLayer = ref<HeaderLayer | null>(null);
let headerExitTimer: ReturnType<typeof setTimeout> | null = null;

watch(headerKey, (newKey) => {
    if (currentLayer.value.key === newKey) return;
    prevLayer.value = { ...currentLayer.value };
    currentLayer.value = {
        key: newKey,
        state: props.toast.state,
        title: props.toast.title,
    };
    if (headerExitTimer) clearTimeout(headerExitTimer);
    headerExitTimer = setTimeout(() => {
        prevLayer.value = null;
        headerExitTimer = null;
    }, HEADER_EXIT_MS);
});

/* -------------------------------- Computed -------------------------------- */
const hasDesc = computed(() => Boolean(props.toast.description) || Boolean(props.toast.button));
const isLoading = computed(() => props.toast.state === 'loading');
const open = computed(() => hasDesc.value && isExpanded.value && !isLoading.value);
const allowExpand = computed(() => !isLoading.value && props.canExpand);

const resolvedRoundness = computed(() => Math.max(0, props.toast.roundness ?? DEFAULT_ROUNDNESS));
const blur = computed(() => resolvedRoundness.value * BLUR_RATIO);
const filterId = computed(() => `sileo-gooey-${props.toast.id}`);

const minExpanded = computed(() => HEIGHT * MIN_EXPAND_RATIO);
const rawExpanded = computed(() =>
    hasDesc.value ? Math.max(minExpanded.value, HEIGHT + contentHeight.value) : minExpanded.value
);

const frozenExpanded = ref(rawExpanded.value);
watch(open, (isOpen) => {
    if (isOpen) frozenExpanded.value = rawExpanded.value;
});
watch(rawExpanded, (val) => {
    if (open.value) frozenExpanded.value = val;
});

const expanded = computed(() => open.value ? rawExpanded.value : frozenExpanded.value);
const svgHeight = computed(() => hasDesc.value ? Math.max(expanded.value, minExpanded.value) : HEIGHT);
const expandedContent = computed(() => Math.max(0, expanded.value - HEIGHT));

const resolvedPillWidth = computed(() => Math.max(pillWidth.value || HEIGHT, HEIGHT));
const pillHeight = computed(() => HEIGHT + blur.value * 3);

const pillX = computed(() => {
    if (props.position === 'right') return WIDTH - resolvedPillWidth.value;
    if (props.position === 'center') return (WIDTH - resolvedPillWidth.value) / 2;
    return 0;
});

const viewBox = computed(() => `0 0 ${WIDTH} ${svgHeight.value}`);

/* ---------------------------- Motion targets ------------------------------ */
const pillAnimate = computed(() => ({
    x: pillX.value,
    width: resolvedPillWidth.value,
    height: open.value ? pillHeight.value : HEIGHT,
}));

const bodyAnimate = computed(() => ({
    height: open.value ? expandedContent.value : 0,
    opacity: open.value ? 1 : 0,
}));

const pillTransition = computed(() => ready.value ? SPRING : { duration: 0 })
const bodyTransition = computed(() => open.value ? SPRING : { ...SPRING, bounce: 0 })

/* ----------------------------- Root styles -------------------------------- */
const rootStyle = computed(() => ({
    '--_h': `${open.value ? expanded.value : HEIGHT}px`,
    '--_pw': `${resolvedPillWidth.value}px`,
    '--_px': `${pillX.value}px`,
    '--_ht': `translateY(${open.value ? (props.expand === 'bottom' ? 3 : -3) : 0}px) scale(${open.value ? 0.9 : 1})`,
    '--_co': `${open.value ? 1 : 0}`,
}));

/* ---------------------------- Measurements -------------------------------- */
let pillRo: ResizeObserver | null = null;
let contentRo: ResizeObserver | null = null;
let headerPad: number | null = null;

const measurePill = () => {
    const el = innerRef.value;
    const header = headerRef.value;
    if (!el || !header) return;
    if (headerPad === null) {
        const cs = getComputedStyle(header);
        headerPad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    }
    const w = el.scrollWidth + headerPad + PILL_PADDING;
    if (w > PILL_PADDING) pillWidth.value = w;
};

const measureContent = () => {
    const el = contentRef.value;
    if (!el) return;
    contentHeight.value = el.scrollHeight;
};

/* --------------------------- Auto expand/collapse ------------------------- */
let autoExpandTimer: ReturnType<typeof setTimeout> | null = null;
let autoCollapseTimer: ReturnType<typeof setTimeout> | null = null;

const clearAutoTimers = () => {
    if (autoExpandTimer) { clearTimeout(autoExpandTimer); autoExpandTimer = null; }
    if (autoCollapseTimer) { clearTimeout(autoCollapseTimer); autoCollapseTimer = null; }
};

watch([hasDesc, allowExpand, () => props.toast.exiting, () => props.toast.instanceId], () => {
    clearAutoTimers();

    if (!hasDesc.value || props.toast.exiting || !allowExpand.value) {
        isExpanded.value = false;
        return;
    }
    const expandDelay = props.toast.autoExpandDelayMs ?? 0;
    const collapseDelay = props.toast.autoCollapseDelayMs ?? 0;

    if (expandDelay > 0) {
        autoExpandTimer = setTimeout(() => { isExpanded.value = true; }, expandDelay);
    } else {
        isExpanded.value = true;
    }
    if (collapseDelay > 0) {
        autoCollapseTimer = setTimeout(() => { isExpanded.value = false; }, collapseDelay);
    }
}, { immediate: true });

/* --------------------------------- Swipe ---------------------------------- */
const SWIPE_DISMISS = 30;
const SWIPE_MAX = 20;
let pointerStart: number | null = null;

const onPointerMove = (e: PointerEvent) => {
    const el = buttonRef.value;
    if (pointerStart === null || !el) return;
    const dy = e.clientY - pointerStart;
    const sign = dy > 0 ? 1 : -1;
    const clamped = Math.min(Math.abs(dy), SWIPE_MAX) * sign;
    el.style.transform = `translateY(${clamped}px)`;
};

const onPointerUp = (e: PointerEvent) => {
    const el = buttonRef.value;
    if (pointerStart === null || !el) return;
    const dy = e.clientY - pointerStart;
    pointerStart = null;
    el.style.transform = '';
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerup', onPointerUp);
    if (Math.abs(dy) > SWIPE_DISMISS) emit('dismiss');
};

const onPointerDown = (e: PointerEvent) => {
    if (props.toast.exiting) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-sileo-button]')) return;
    pointerStart = e.clientY;
    const el = buttonRef.value;
    if (el) {
        el.setPointerCapture(e.pointerId);
        el.addEventListener('pointermove', onPointerMove, { passive: true });
        el.addEventListener('pointerup', onPointerUp, { passive: true });
    }
};

/* -------------------------------- Lifecycle ------------------------------- */
onMounted(async () => {
    requestAnimationFrame(() => { ready.value = true; });

    pillRo = new ResizeObserver(measurePill);
    if (innerRef.value) pillRo.observe(innerRef.value);
    measurePill();

    await nextTick();
    if (hasDesc.value && contentRef.value) {
        contentRo = new ResizeObserver(measureContent);
        contentRo.observe(contentRef.value);
        measureContent();
    }
});

watch(headerKey, async () => {
    await new Promise(r => requestAnimationFrame(r));
    measurePill();
});

watch(hasDesc, async (val) => {
    if (val) {
        await nextTick()
        if (contentRef.value) {
            contentRo = new ResizeObserver(measureContent)
            contentRo.observe(contentRef.value)
            measureContent()
        }
    } else {
        contentRo?.disconnect()
        contentHeight.value = 0
    }
})

onUnmounted(() => {
    pillRo?.disconnect();
    contentRo?.disconnect();
    clearAutoTimers();
    if (headerExitTimer) clearTimeout(headerExitTimer);
});

/* -------------------------------- Handlers -------------------------------- */
const handleMouseEnter = () => {
    if (hasDesc.value) isExpanded.value = true;
};

const handleMouseLeave = () => {
    isExpanded.value = false;
};

const handleButtonClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    props.toast.button?.onClick();
};
</script>

<template>
    <button ref="buttonRef" type="button" data-sileo-toast :data-ready="ready" :data-expanded="open"
        :data-exiting="toast.exiting" :data-edge="expand" :data-position="position" :data-state="toast.state"
        :style="rootStyle" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave" @pointerdown="onPointerDown">
        <!-- SVG Canvas -->
        <div data-sileo-canvas :data-edge="expand" :style="{ filter: `url(#${filterId})` }">
            <svg data-sileo-svg :width="WIDTH" :height="svgHeight" :viewBox="viewBox">
                <title>Sileo Notification</title>
                <defs>
                    <filter :id="filterId" x="-20%" y="-20%" width="140%" height="140%"
                        color-interpolation-filters="sRGB">
                        <feGaussianBlur in="SourceGraphic" :stdDeviation="blur" result="blur" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
                            result="goo" />
                        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                    </filter>
                </defs>
                <MotionRect data-sileo-pill :rx="resolvedRoundness" :ry="resolvedRoundness" :fill="fill"
                    :initial="false" :animate="pillAnimate" :transition="pillTransition" />
                <MotionRect data-sileo-body :y="HEIGHT" :width="WIDTH" :rx="resolvedRoundness" :ry="resolvedRoundness"
                    :fill="fill" :initial="false" :animate="bodyAnimate" :transition="bodyTransition" />
            </svg>
        </div>

        <!-- Header -->
        <div ref="headerRef" data-sileo-header :data-edge="expand">
            <div data-sileo-header-stack>
                <div ref="innerRef" :key="currentLayer.key" data-sileo-header-inner data-layer="current">
                    <div data-sileo-badge :data-state="currentLayer.state" :class="toast.styles?.badge">
                        <component :is="toast.icon" v-if="toast.icon" />
                        <SileoIcon v-else :state="currentLayer.state" />
                    </div>
                    <span data-sileo-title :data-state="currentLayer.state" :class="toast.styles?.title">
                        {{ currentLayer.title }}
                    </span>
                </div>

                <div v-if="prevLayer" :key="prevLayer.key" data-sileo-header-inner data-layer="prev"
                    data-exiting="true">
                    <div data-sileo-badge :data-state="prevLayer.state">
                        <SileoIcon :state="prevLayer.state" />
                    </div>
                    <span data-sileo-title :data-state="prevLayer.state">
                        {{ prevLayer.title }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div v-if="hasDesc" data-sileo-content :data-edge="expand" :data-visible="open">
            <div ref="contentRef" data-sileo-description :class="toast.styles?.description">
                {{ toast.description }}
                <button v-if="toast.button" type="button" data-sileo-button :data-state="toast.state"
                    :class="toast.styles?.button" @click="handleButtonClick">
                    {{ toast.button.title }}
                </button>
            </div>
        </div>
    </button>
</template>