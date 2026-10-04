---
name: principle-build-resilient-pwas
description: 'Apply only when building, improving, or reviewing a Progressive Web App (PWA): preserve the core journey through offline use, installation, and updates. Ordinary responsive websites and native apps are outside this principle.'
disable-model-invocation: true
---

# Build Resilient PWAs

Make the essential journey survive a lost connection, a relaunch, and a new app
version. Installation should make an already useful web experience more convenient.

**Scope:** Use only for a requested PWA or an established PWA task involving its
app lifecycle. A mobile layout, service worker, or browser storage alone does not
justify introducing PWA functionality. Within an explicit `aop-mode` invocation,
load this principle only when that scope applies.

**Why:** An install icon proves little if a deep link fails offline, a saved edit
vanishes after restart, or an update discards the user's work.

- Define the offline promise for the actual task. Distinguish first visit, previously loaded content, locally saved edits, and operations that require a server. Keep the useful local journey available when optional online features fail.
- Separate the app shell from user data. Cache the assets and navigation fallback needed to open the app; persist domain data in the project's durable store. A cached shell or an optimistic screen does not prove that a write survived.
- Scope navigation and caching deliberately. Keep the manifest, start URL, service worker control, deployment base, and deep-link fallback aligned. Exclude unrelated pages and API responses from the shell fallback. Choose custom worker code only for behavior the generated worker cannot express.
- Preserve work across updates. Offer an update at a recoverable point and allow deferral. Persist drafts before activation or reload, handle save failure, and consider other open tabs and storage migrations. Do not force an update in the middle of input.
- Make installation optional and timely. Use an available browser install action or accurate platform guidance, remember dismissal, and avoid repeated prompts in standalone mode. Request notification permission only for a user-requested feature that needs it.
- Show useful state honestly. Local save, pending sync, server acknowledgment, offline shell readiness, and update availability are different facts. Treat connectivity indicators as hints; handle actual request failures without discarding input or blocking local work.
- Design the installed experience. Keep navigation, back behavior, focused inputs, and primary actions usable with safe areas, browser chrome, and the software keyboard. Preserve zoom, selection where useful, keyboard access, and alternatives to gestures.
- Match persistence and synchronization to the product. Reuse the existing stack. When remote sync is required, define retry identity, conflict handling, and account boundaries; when valuable records live only in the browser, provide recovery appropriate to their value. PWA support does not require cloud sync, push, authentication, AI, or a particular database.
- Verify the production artifact through real browser journeys. Cover offline deep links and reloads, durable edits, reconnection where applicable, and an update from one build to another. Report browser emulation separately from actual installed-device checks.

**The test:** After the app has prepared for offline use, can someone reopen the
essential journey without a network, preserve their work, and accept an update
without losing it?

Read [PWA implementation and verification](references/pwa-implementation.md) when
planning the lifecycle, choosing cache boundaries, or proving offline/update
behavior. It links a pinned Tilly source review and distinguishes observed
patterns from additional aop-mode guidance.
