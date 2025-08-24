// src/test/setup.ts
// jsdom već donosi window/localStorage.
// Dodamo samo randomUUID da testovi budu stabilni.
if (!("crypto" in globalThis)) (globalThis as any).crypto = {};
if (!("randomUUID" in (globalThis.crypto as any))) {
  (globalThis.crypto as any).randomUUID = () =>
    "test-id-" + Math.random().toString(36).slice(2);
}
