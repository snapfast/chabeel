## 2025-05-22 - [UX/Accessibility Improvements for Map and Form]
**Learning:** For interactive maps (Leaflet), a "Locate Me" button without a loading state can lead to user frustration or multiple redundant requests if the browser's geolocation prompt is slow. Providing an `isLocating` state with a spinning icon and `aria-label` provides immediate feedback. For forms triggered by map clicks, `autoFocus` on the primary input and clear `aria-label` on close buttons significantly improve the experience for both mouse and screen reader users.
**Action:** Always include async feedback (loading spinners) for geolocation and ensure map-triggered modals/overlays manage focus and provide accessible exit paths.

## 2025-05-25 - [Form Guardrails and Dynamic ARIA Updates]
**Learning:** In crowd-sourced data entry forms, explicit character counters combined with `maxLength` attributes prevent validation surprises and improve perceived reliability. For reverse-geocoded fields (like addresses), `aria-live="polite"` is essential to notify screen reader users of background updates without interrupting their current task.
**Action:** Implement character counters for all limited text inputs and use `aria-live` for any field that updates based on map interactions or async operations.
