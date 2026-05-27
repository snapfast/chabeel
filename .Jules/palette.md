## 2025-05-22 - [UX/Accessibility Improvements for Map and Form]
**Learning:** For interactive maps (Leaflet), a "Locate Me" button without a loading state can lead to user frustration or multiple redundant requests if the browser's geolocation prompt is slow. Providing an `isLocating` state with a spinning icon and `aria-label` provides immediate feedback. For forms triggered by map clicks, `autoFocus` on the primary input and clear `aria-label` on close buttons significantly improve the experience for both mouse and screen reader users.
**Action:** Always include async feedback (loading spinners) for geolocation and ensure map-triggered modals/overlays manage focus and provide accessible exit paths.

## 2025-05-23 - [Form Accessibility and Feedback]
**Learning:** Adding `aria-live="polite"` to dynamically updated areas like detected addresses ensures screen reader users are notified of async changes without being interrupted. Character counters paired with `maxLength` provide essential feedback and constraints, preventing submission errors. Decorative icons within buttons with `aria-label` must have `aria-hidden="true"` to avoid redundant ligature announcements.
**Action:** Always pair `maxLength` with visible character counters for length-limited inputs and use `aria-live` for any asynchronously updated text in forms.
