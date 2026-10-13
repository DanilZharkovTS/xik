# XIK public website assistant

The shared MainLayout loads the standard Agent Platform widget for public routes, using the public routing ID `xik-app`. The production origin is exactly `https://xik.app`. No provider key, administrator token or tenant credential is embedded in website code.

`PublicChatWidget` uses Next Script lazy loading. It checks the current pathname before mounting, removes the frame on navigation into account/workspace routes, and remounts through the stock loader API when returning to public pages. A late script completion cannot mount on a private route. English, Spanish and Ukrainian pages use the same visitor widget. Content is answered in the visitor's language; configured welcome/header text is English.

## Agent and Knowledge

Production Agent Platform company XIK owns Agent XIK, published v1, with Strict RAG (required retrieval, citations required, external sources denied). The existing shared Cloud adapter serves XIK through its explicit organization grant. Initial Web Serving was activated after a completed bounded compatibility probe.

The Knowledge base contains 28 English canonical website documents fetched on 2026-10-13, with original source URLs. The public test blog entry was excluded. Each document uses the immutable OpenAI text-embedding-3-small / 1536 profile and references XIK's effective Providers connection. Documents and query embeddings use the same profile. Website content is a snapshot; no scheduled crawler is configured.

The Business Classic widget has Knowledge search enabled. A genuine public API query returned a sourced answer about engineering services. An unrelated request returned insufficient-information refusal. The first attempt failed closed because widget knowledge scope was absent; normal technical configuration corrected that before retesting. All 28 documents are ready for search.

The user authorized up to $0.10 for initial indexing/startup checks. Document embeddings reported 12668 tokens; one compatibility probe reported 350 input/5 output tokens with a $0.01 reservation ceiling. Exact provider monetary fields are unavailable and are not zero-cost evidence. Visitor tokens were retained only in test process memory.

## Release repairs

The user separately authorized repairing existing release blockers. Next and eslint-config-next are upgraded to 16.4.0; compatible transitive patches were resolved through npm audit fix without force. Production audit reports zero advisories; development tooling may still report an upstream braces advisory without a compatible fix. Do not downgrade Next/eslint to silence development audit.

The current public design replaced historical dinosaur, boot, workflow and ScrollChomper components. E2E scenarios now verify actual content/navigation, static/reduced-motion behavior, clear gutters and keyboard focus rather than deleted feature selectors. No accessibility rules were disabled. Mobile navigation uses a native modal dialog with explicit Tab containment, Escape, scroll locking and restored focus. Header background is opaque to preserve text contrast. Root 404 has title, language and main landmarks. Invalid locales and missing products fail before indexable canonical metadata is produced. JSON-LD offers match the visible price, independently of whether online checkout is enabled; hidden prices remain hidden.

Browser fixtures mock anonymous authentication and the chat loader by default, preventing paid calls and external writes. Session and widget lifecycle cases override those mocks explicitly. The verification server reads the existing public API catalog; no database or customer account was changed for testing.

## Verification

Initial widget-only verification: Node 24, npm ci, typecheck, lint and production build passed; 10 lifecycle tests passed. The first full baseline exposed stale selectors, absent local catalog prerequisites and transient theme contrast; those runs are historical failures, not passes.

Final local release checks on 2026-10-13: Node 24.19.0; Next 16.4.0 production build, full lint, typecheck and diff hygiene PASS. All 77 frontend E2E/Axe tests PASS (0 skipped, 0 failed, 0 flaky) against the final production artifact, using installed Chrome and the existing public API catalog. npm audit --omit=dev reports 0 vulnerabilities. The final two previously failing 404/price cases also passed separately before the full checkpoint. Production rollout/acceptance is tracked in the server release receipt; this commit does not claim a rollout that has not yet occurred. Backend, database and notification code/configuration are unchanged; no migrations are part of this frontend-only release.
