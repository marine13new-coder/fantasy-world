# Korea Zombie Survival — persistent development rules

- Product direction: LONG-TERM survival in Korean real-world neighbourhoods. Do not shorten the game or turn extraction into the final ending to differentiate it. Preserve campaign saves, resources, shelter progression and district operations. Differentiate via facility-driven looting, deliberate precision shooting, stamina-based melee and Korean setting.
- Develop toward commercial Steam/Android quality, while reporting actual release readiness honestly. Preserve licensed assets and license files. Never discard progression merely to simplify testing.

- Use Unity 6, C#, metre-scale X/Z world coordinates; spawn origin is Gangnam station (37.4979, 127.0276).
- Component pattern: keep map, buildings, input, combat, AI, presentation, atmosphere and survival independent. GameBootstrap must create a playable scene without manual prefab/UI work.
- Data-driven design: expose serializable inspector data. Resources/GameBalance.asset is the editable Inspector balance source; JSON is the fallback/import seed. Validate untrusted network/JSON input. Do not hardcode new balance values throughout behaviours.
- Explicit player states: Idle, Move, FocusAim, Shoot, MeleeSwing, Reload, Interact, Dead. Zombie states: Idle, Patrol, Chase, Attack, HeadshotStun, Dead.
- Preserve optional prefab, Animator and AudioClip replacement slots. Missing assets must always have procedural fallbacks. Presentation-only scripts own animation/audio slots; do not add unused slots to unrelated components.
- Read implicated code and callers first when an error occurs. Fix the root cause, run regression checks, and record actual verification in Docs/VERIFICATION.md. Never claim a Unity playtest or build passed without evidence.
- Keep changes within this project. Existing sibling web games must keep working. Do not relocate their entry points or delete their assets.
- OSM outages must not block play. Bound requests, chunk count, AI count, geometry and cache. Preserve looted/dead IDs when revisiting chunks within a run. Label synthetic scenery and retain OSM attribution.
- Do not silently add unverified third-party packages/assets. Pin dependencies and retain license notices. Real addresses do not imply accurate interiors.
- FreeLLMAPI may draft bounded data or copy. Review every draft before merging; never send source secrets, saved games or precise player GPS to an external model. The local worker only writes Tools/AI-Drafts and never runs generated code.
- Before releases: test actual Windows/Android builds, profiling, save/resume, accessibility, device controls, asset licenses and store requirements. Prototype completion is not release certification.
- /graphify: use the installed graphify skill before other work when explicitly requested.
