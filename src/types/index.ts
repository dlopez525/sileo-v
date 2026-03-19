import type { Component } from "vue";
import { SILEO_POSITIONS } from "../constants";

export type SileoPosition = (typeof SILEO_POSITIONS)[number];

export type SileoState =
    | "success"
    | "loading"
    | "error"
    | "warning"
    | "info"
    | "action";

export interface SileoStyles {
    title?: string;
    description?: string;
    badge?: string;
    button?: string;
}

export interface SileoButton {
    title: string;
    onClick: () => void;
}

export interface SileoOptions {
    id?: string; 
    title?: string;
    description?: Component | string;
    type?: SileoState;
    position?: SileoPosition;
    duration?: number | null;
    icon?: Component | null;
    styles?: SileoStyles;
    fill?: string;
    roundness?: number;
    autopilot?: boolean | { expand?: number; collapse?: number };
    button?: SileoButton;
}