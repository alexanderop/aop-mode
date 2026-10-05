# Attribution and upstream source

aop-mode is an independent project by Alexander Opalic. It packages and adapts
[pstack](https://github.com/cursor/plugins/tree/main/pstack), created by
[Lauren Tan (poteto)](https://github.com/poteto). It is not a GitHub fork, an
official port, or endorsed by Lauren Tan or Cursor.

The complete original pstack v0.15.9 tree is reproduced without changes in
`vendor/pstack/` from `cursor/plugins` commit
`e43c7ee26e0038c6c1fa8380dd34ce86ff94cb2a`.
Copyright (c) 2026 Lauren Tan. Its MIT license is retained in
`vendor/pstack/LICENSE` and every generated installation. `upstream.lock.json`
records every original file's SHA-256 and executable mode.

The wrappers, runtime translations, explicit-only activation policy, installer,
evaluation harness, and Starlight documentation are aop-mode's own additions.
Generated wrappers normalize skill names to directory names and disable implicit
activation. They load original workflows intact from the bundled upstream tree.
No upstream workflow text is silently rewritten.

[Michael Denyer's pstack-claude](https://github.com/michael-denyer/pstack-claude)
was studied as a reference for cross-harness adaptation. Its implementation and
automatic routing hook are not included.

The local `improve-codebase-architecture` skill is adapted from
[Matt Pocock's skills](https://github.com/mattpocock/skills), pinned for attribution
at commit `d81f3a183412e71a5b1e84ca21bc1a35eea03a60`.
Copyright (c) 2026 Matt Pocock. Its MIT license is retained at
`skills/improve-codebase-architecture/LICENSE` and included in each distribution.
The adaptation uses aop-mode's writing, visual reporting, and explicit invocation
conventions. It does not imply endorsement by Matt Pocock.
