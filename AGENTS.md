# Workspace guide & Architecture Rules

This workspace contains existing Python/web games, KoreaZombieSurvival, and the Dark Fantasy Roguelike 'Abyss Roll: Darkest Vertical Roguelike'.

## Abyss Roll 4 Core Architecture Principles (Zero-Tolerance)
1. **Component Pattern**: Monolithic scripts are strictly forbidden. Split strictly into:
   - `VerticalDungeonUIManager`: Safe-area notch and 3-tier vertical view control.
   - `SanityAndTorchManager`: Torchlight intensity, stress 0-100, affliction/virtue panic states, quirks.
   - `RandomDiceAndSlotCombat`: D6-D20 dice crafting, hold/reroll slot tactical combat, skill stickers.
   - `DungeonGridAndRankManager`: Rank 1-4 spatial positions and procedural node map crawling.
   - `DarkestJuiceAndCutInEngine`: Hitstop, camera shake, zoom-tilt cut-in collisions, chroma-key sprite injection.
   - `DarkAudioAndHapticManager`: Synthesized procedural dark D-minor audio, heartbeat, bone dice rattle, bell tolls, haptics.
   - `PlayStoreReleaseAndBMManager`: Rewarded ads, heirloom progression, auto encrypted save, 1-Click AAB export setup.

2. **Data-Driven Design**:
   - Zero hardcoded balance values in C# logic. All hero/monster stats, quirks, dice face stickers, relics, and curios are loaded from `Assets/StreamingAssets/` JSON.
   - The FreeLLMWorker populates rich content into these JSON files.

3. **Strict State Machine**:
   - Flow: `TownLobby -> DungeonMapRoll -> CombatStart -> TurnRoll -> PlayerHoldAndReroll -> ActionCutIn -> StressCheck -> EnemyTurn -> RelicReward -> GameOver/Victory`.

4. **Procedural Gothic Dark Fantasy UI & Hot-Swap Slots**:
   - Primary palette: Background `#090A0F`, Crimson `#8B0000`, Antique Brass `#C5A059`, Bone `#E2DCC8`.
   - Procedural silhouette fallbacks for all characters and monsters when images are absent.
   - `[Header("Hot-Swap Sprite & Audio Slots")]` and runtime chroma-key filter (`ChromaKeyFilter.cs`) remove `#00FF00` green screen automatically on PNG drop.
