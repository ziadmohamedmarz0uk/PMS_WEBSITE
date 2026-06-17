# Frontend Rules (Next.js & React)

## Architecture
- Use **Next.js App Router**.
- Leverage **React Server Components (RSC)** for data fetching that does not require client interactivity. Use `'use client'` only when utilizing hooks, state, or browser APIs.

## TypeScript Enforcement
- **Strict Typing**: All API payloads, responses, and component props must have defined TypeScript `Interfaces` or `Types`. Do not use `any`.

## State Management (POS System)
- The POS cart state must be managed with a robust local state solution (e.g., Zustand or Redux Toolkit) to ensure zero latency during high-speed scanning. Avoid unnecessary re-renders.

## Keyboard Interactivity
- The POS module must attach global keyboard event listeners on mount.
- Ensure event listeners are properly cleaned up on unmount to prevent memory leaks.
- Intercept default browser behaviors (like F-keys opening dev tools or search) where applicable and safe, redirecting them to POS actions.
