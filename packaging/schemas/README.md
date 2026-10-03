# Agent Plugins schema

`agent-plugins-1.0.0.json` is an unchanged copy of the canonical schema at
https://agent-plugins.org/schemas/1.0.0/plugin.schema.json (retrieved 2026-10-03).
It is kept locally so package validation works offline. The specification also
has semantic requirements beyond JSON validation:
https://agent-plugins.org/specification.

`packaging/plugin.json` is the package metadata source. The build derives Claude's
compatibility manifest from it. Keep its version aligned with package.json;
the package tests enforce this.
