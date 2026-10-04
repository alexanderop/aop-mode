# PWA implementation and verification

## Source and limits

Inspired by [Carl Assmann's Tilly](https://github.com/carlassmann/tilly), reviewed at
commit `0bb6bbba42b9e283d0147ea2d0213e4495b00f17` on 2026-10-04.
This is a source review, not a runtime certification of Tilly. The guidance and
example below are original aop-mode material; Tilly's application code is not
vendored. Preserve the destination project's framework and dependencies.

## Patterns visible in Tilly

| Source at the reviewed revision                                                                                                                                                                                                                                                       | Observed pattern                                                                          | Transferable decision                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [PWA build configuration](https://github.com/carlassmann/tilly/blob/0bb6bbba42b9e283d0147ea2d0213e4495b00f17/astro.config.ts)                                                                                                                                                         | Prompt registration, `injectManifest`, selected asset globs                               | Make update policy and the cached asset budget explicit. Custom workers are conditional, not a default requirement.            |
| [Service worker](https://github.com/carlassmann/tilly/blob/0bb6bbba42b9e283d0147ea2d0213e4495b00f17/src/app/sw.ts)                                                                                                                                                                    | Precaching and an `/app` shell fallback limited to `/app` navigations                     | Reopening a deep link needs the shell even when the network is gone. Keep APIs and marketing routes outside that fallback.     |
| [Manifest](https://github.com/carlassmann/tilly/blob/0bb6bbba42b9e283d0147ea2d0213e4495b00f17/public/app/manifest.json)                                                                                                                                                               | App-scoped start URL, standalone display, named icons and theme                           | Align installation identity and paths with deployment; check that every referenced asset actually exists.                      |
| [Status UI](https://github.com/carlassmann/tilly/blob/0bb6bbba42b9e283d0147ea2d0213e4495b00f17/src/app/components/status-indicator.tsx)                                                                                                                                               | An update toast offers update and later; offline details distinguish feature availability | Give people control over interruption and explain only the affected capability.                                                |
| [Install dialog](https://github.com/carlassmann/tilly/blob/0bb6bbba42b9e283d0147ea2d0213e4495b00f17/src/app/components/pwa-install-dialog.tsx) and [persisted dismissal](https://github.com/carlassmann/tilly/blob/0bb6bbba42b9e283d0147ea2d0213e4495b00f17/src/app/lib/pwa-store.ts) | Browser prompt or platform instructions; dismissal stored in IndexedDB                    | Adapt installation to available capabilities and remember the user's choice.                                                   |
| [App composition](https://github.com/carlassmann/tilly/blob/0bb6bbba42b9e283d0147ea2d0213e4495b00f17/src/app/main.tsx)                                                                                                                                                                | Jazz data/sync provider is separate from PWA registration                                 | Shell caching and domain persistence solve different problems. Jazz, React, and Clerk are Tilly choices, not PWA requirements. |
| [App document](https://github.com/carlassmann/tilly/blob/0bb6bbba42b9e283d0147ea2d0213e4495b00f17/src/pages/app/index.astro) and [navigation](https://github.com/carlassmann/tilly/blob/0bb6bbba42b9e283d0147ea2d0213e4495b00f17/src/app/components/navigation.tsx)                   | Standalone metadata, dynamic viewport height, safe-area positioning                       | Inspect the installed shell with the software keyboard and device insets.                                                      |

Do not copy every detail. The reviewed document disables zoom and applies broad
selection suppression; retain accessible zoom and useful text selection instead.
Tilly's [connectivity hook](https://github.com/carlassmann/tilly/blob/0bb6bbba42b9e283d0147ea2d0213e4495b00f17/src/app/hooks/use-online-status.ts)
uses a one-time probe and browser connectivity events. Neither proves that a
particular save or synchronization succeeded. Its update UI is evidence of a
choice to defer, not evidence of draft recovery or compatibility across tabs.

## Plan the actual promise

For a journal PWA, an illustrative contract is:

| Situation                                        | Expected experience                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| First visit without any cached installation      | Do not promise an app that the browser has never downloaded.                                                  |
| Returning offline with previously loaded records | Open the shell and those records, including a bookmarked detail route.                                        |
| Editing offline                                  | Commit locally, show local success only after persistence, and retain the edit after reload.                  |
| Optional online assistant unavailable            | Keep ordinary editing usable and preserve the assistant's unsent input.                                       |
| Sync reconnects, if sync exists                  | Retry with stable operation identity; surface conflicts or authorization failures without losing local edits. |
| New version is ready                             | Let the user defer; persist current work before activating and reloading.                                     |

Adjust the contract to the task. A server-authoritative workflow may allow cached
reading and drafts without allowing offline submission. Describe that limitation
rather than pretending every action is available offline.

## Implementation choices

For an existing Vite/Vue app, use its PWA integration; for a new one,
`vite-plugin-pwa` is a reasonable fit. Start with generated worker behavior when
it meets the contract. Use `injectManifest` only when custom routing, push, or
other worker logic warrants owning its lifecycle. Verify the installed version's
API before adding configuration. Tilly's Astro integration is not a drop-in Vite
configuration.

Keep these responsibilities distinct:

- **Shell:** Precache required versioned assets and an app-scoped navigation fallback. Check the actual built manifest, lazy chunks, icons, MIME types, base paths, and server deep-link handling. Never return app HTML for an API request.
- **Records:** Use the existing IndexedDB-backed store or equivalent. Await durable writes before showing “Saved.” Handle quota/write failure with retained input and a recovery action. Cache cleanup must not erase domain data.
- **Sync, when required:** Use the existing sync engine or an atomic local record/outbox transaction. Retrying a request must not create duplicates. Decide how concurrent edits, expired authentication, and account switching behave; reconnecting is not itself acknowledgment.
- **Updates:** Use prompt-based activation for editable workflows. A fresh worker can coexist with older pages; make schema migration compatible or coordinate old tabs before activation. Keep old asset availability in mind when deploying lazy-loaded routes.
- **Installation:** Check capabilities rather than assuming browser behavior from viewport width. Keep browser use available. Verify current instructions on each supported platform; install-prompt events and notification support are not universal.

Browser storage is not a backup. For valuable local-only records, decide whether
export/import or another recovery path belongs in scope; validate imported data
and rehearse restoration. Do not add a server merely to claim durability.

## Example: an update gate that preserves work

This framework-independent TypeScript example models one tab's decision. It is
not Tilly code or a complete service-worker manager. `persistDraft` must resolve
only after durable storage succeeds. The UI freezes editing while this operation
runs and renders the returned outcome; `otherTabsReady` comes from actual
coordination when multiple tabs can edit. Use a fresh state snapshot per attempt.

```ts
type UpdateState = Readonly<{
  updateWaiting: boolean;
  writing: boolean;
  otherTabsReady: boolean;
}>;

type UpdatePorts = Readonly<{
  persistDraft: () => Promise<void>;
  activateAndReload: () => Promise<void>;
}>;

type UpdateOutcome =
  | { kind: 'deferred' }
  | { kind: 'save-failed' }
  | { kind: 'activation-failed' }
  | { kind: 'activation-requested' };

export async function acceptUpdate(state: UpdateState, ports: UpdatePorts): Promise<UpdateOutcome> {
  if (!state.updateWaiting || state.writing || !state.otherTabsReady) {
    return { kind: 'deferred' };
  }
  try {
    await ports.persistDraft();
  } catch {
    return { kind: 'save-failed' };
  }
  try {
    await ports.activateAndReload();
    return { kind: 'activation-requested' };
  } catch {
    return { kind: 'activation-failed' };
  }
}
```

“Later” leaves the waiting worker alone. A save failure retains the current UI and
offers retry or recovery. Activation being requested does not prove a new version
loaded: confirm that in the browser journey. Reuse the PWA integration's reload
behavior rather than issuing a second unconditional reload.

## Verification playbook

Use a dedicated origin serving the production build over HTTPS or localhost.
Keep the real service worker enabled and use fresh browser contexts between
independent scenarios so old registrations cannot make a broken build appear to
work. Do not clear storage between steps intended to prove persistence.

1. **Prepare online:** Load the app, create a record, wait for durable-save feedback and an active controlling worker. Record the build identity and relevant browser version.
2. **Reopen offline:** Turn off network access, navigate to a previously loaded detail route, and reload. Read and edit the record, reload again, then reopen it in a new page in the same context. Assert the saved values, not only an offline badge. Check an uncached record has an honest unavailable state.
3. **Recover online, if syncing:** Reconnect and verify the edit through a second client or the authoritative service. Repeat a failed delivery and assert one logical edit. Cover a conflicting edit if collaboration is promised.
4. **Upgrade:** Serve build A, enter a draft, then replace it with build B at the same origin without clearing storage. Observe update availability, choose later, and verify the draft remains. Accept the update and verify build B, the draft, and existing records. Repeat with a second tab and with local-save failure; failure must not trigger reload.
5. **Inspect installation:** Verify manifest and icon responses, start URL, scope, and standalone launch on a supported device. Confirm dismissal is remembered. Check deep links, back navigation, safe areas, zoom, and keyboard-obscured actions. Desktop emulation does not establish mobile installation behavior.
6. **Check optional capabilities only when present:** Permission denial must leave the core usable. For notifications, test account isolation and opening the intended record; for import/export, test restoration into a fresh profile.

Use unit tests for update decisions and retry rules, real browser tests for
storage and component interaction, and Playwright for the production journeys.
A configuration test or Lighthouse score cannot replace these outcomes. Record
which scenarios and platforms ran; mark device-only or two-build checks untested
when they were not executed.

The source review that produced this reference did not execute these journeys
against Tilly. aop-mode distribution tests establish packaging and invocation
policy only, not live-agent adherence to this principle.

## Platform references

- [Vite PWA: prompt for update](https://vite-pwa-org.netlify.app/guide/prompt-for-update.html) documents user-controlled refresh and client-only registration for SSR.
- [MDN: navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine) explains why connectivity is a hint rather than proof of service availability.
- [MDN: offline and background operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation) explains the service-worker lifecycle and offline responsibilities.
