import { writable } from 'svelte/store';
export const route = writable<'home'|'training'|'edu'|'progress'|'profile'>('home');
