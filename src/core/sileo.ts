import type { SileoOptions, SileoPosition, SileoState } from "../types";
import {
    AUTO_COLLAPSE_DELAY,
    AUTO_EXPAND_DELAY,
    DEFAULT_DURATION,
    DEFAULT_POSITION,
    EXIT_DURATION,
} from "../constants";

/* ---------------------------------- Types --------------------------------- */
export interface SileoToast extends SileoOptions {
    id: string;
    instanceId: string;
    state: SileoState;
    position: SileoPosition;
    exiting?: boolean;
    autoExpandDelayMs?: number;
    autoCollapseDelayMs?: number;
}

export interface SileoPromiseOptions<T = unknown> {
    loading: SileoOptions;
    success: SileoOptions | ((data: T) => SileoOptions);
    error: SileoOptions | ((err: unknown) => SileoOptions);
    action?: SileoOptions | ((data: T) => SileoOptions);
    position?: SileoPosition;
}

/* ---------------------------------- Store --------------------------------- */
type Listener = (toasts: SileoToast[]) => void;

let idCounter = 0;
const generateId = () =>
    `${++idCounter}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const store = {
    toasts: [] as SileoToast[],
    listeners: new Set<Listener>(),
    position: DEFAULT_POSITION as SileoPosition,
    options: undefined as Partial<SileoOptions> | undefined,

    emit() {
        for (const fn of this.listeners) fn(this.toasts);
    },

    update(fn: (prev: SileoToast[]) => SileoToast[]) {
        this.toasts = fn(this.toasts);
        this.emit();
    },

    subscribe(fn: Listener) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    },
};

/* --------------------------------- Helpers -------------------------------- */
const resolveAutopilot = (
    opts: SileoOptions,
    duration: number | null
): { expandDelayMs?: number; collapseDelayMs?: number } => {
    if (opts.autopilot === false || !duration || duration <= 0) return {};
    const cfg = typeof opts.autopilot === "object" ? opts.autopilot : undefined;
    const clamp = (v: number) => Math.min(duration, Math.max(0, v));
    return {
        expandDelayMs: clamp(cfg?.expand ?? AUTO_EXPAND_DELAY),
        collapseDelayMs: clamp(cfg?.collapse ?? AUTO_COLLAPSE_DELAY),
    };
};

const mergeOptions = (options: SileoOptions): SileoOptions => ({
    ...store.options,
    ...options,
    styles: { ...store.options?.styles, ...options.styles },
});

const buildToast = (
    merged: SileoOptions & { state: SileoState; id?: string },
    fallbackPosition?: SileoPosition
): SileoToast => {
    const duration = merged.duration !== undefined ? merged.duration : DEFAULT_DURATION;
    const auto = resolveAutopilot(merged, duration);
    return {
        ...merged,
        id: merged.id ?? generateId(),
        instanceId: generateId(),
        state: merged.state,
        position: merged.position ?? fallbackPosition ?? store.position,
        duration,
        autoExpandDelayMs: auto.expandDelayMs,
        autoCollapseDelayMs: auto.collapseDelayMs,
    };
};

/* -------------------------------- Actions --------------------------------- */
const dismissToast = (id: string) => {
    const item = store.toasts.find((t) => t.id === id);
    if (!item || item.exiting) return;

    store.update((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );

    setTimeout(
        () => store.update((prev) => prev.filter((t) => t.id !== id)),
        EXIT_DURATION
    );
};

const createToast = (options: SileoOptions & { state: SileoState }): string => {
    const live = store.toasts.filter((t) => !t.exiting);
    const merged = { ...mergeOptions(options), state: options.state };
    const id = merged.id ?? generateId();
    const prev = live.find((t) => t.id === id);
    const item = buildToast({ ...merged, id }, prev?.position);

    if (prev) {
        store.update((p) => p.map((t) => (t.id === id ? item : t)));
    } else {
        store.update((p) => [...p.filter((t) => t.id !== id), item]);
    }

    return id;
};

const updateToast = (id: string, options: SileoOptions & { state: SileoState }) => {
    const existing = store.toasts.find((t) => t.id === id);
    if (!existing) return;
    const item = buildToast(
        { ...mergeOptions(options), state: options.state, id },
        existing.position
    );
    store.update((prev) => prev.map((t) => (t.id === id ? item : t)));
};

/* ---------------------------------- API ----------------------------------- */
export const sileo = {
    show: (opts: SileoOptions) => createToast({ ...opts, state: opts.type ?? "success" }),
    success: (opts: SileoOptions) => createToast({ ...opts, state: "success" }),
    error: (opts: SileoOptions) => createToast({ ...opts, state: "error" }),
    warning: (opts: SileoOptions) => createToast({ ...opts, state: "warning" }),
    info: (opts: SileoOptions) => createToast({ ...opts, state: "info" }),
    action: (opts: SileoOptions) => createToast({ ...opts, state: "action" }),
    dismiss: dismissToast,
    clear: (position?: SileoPosition) =>
        store.update((prev) =>
            position ? prev.filter((t) => t.position !== position) : []
        ),
    promise<T>(
        promise: Promise<T> | (() => Promise<T>),
        opts: SileoPromiseOptions<T>
    ): Promise<T> {
        const id = createToast({
            ...opts.loading,
            state: "loading",
            duration: null,
            position: opts.position,
        });

        const p = typeof promise === "function" ? promise() : promise;

        p.then((data) => {
            if (opts.action) {
                const actionOpts = typeof opts.action === "function" ? opts.action(data) : opts.action;
                updateToast(id, { ...actionOpts, state: "action" });
            } else {
                const successOpts = typeof opts.success === "function" ? opts.success(data) : opts.success;
                updateToast(id, { ...successOpts, state: "success" });
            }
        }).catch((err) => {
            const errorOpts = typeof opts.error === "function" ? opts.error(err) : opts.error;
            updateToast(id, { ...errorOpts, state: "error" });
        });

        return p;
    },
};

/* --------------------------- Para uso interno ----------------------------- */
export function useToastStore() {
    return { store, dismissToast };
}