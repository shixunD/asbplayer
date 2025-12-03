# asbplayer Copilot Instructions

## Project Overview

asbplayer is a language-learning tool consisting of a **web-based media player** (client) and a **browser extension** that enables users to load subtitles onto streaming videos and create Anki flashcards. Built with TypeScript, React, and Material UI.

## Architecture (Monorepo Structure)

```
├── client/          # Web player app (Vite + React) - standalone media player
├── extension/       # Browser extension (WXT framework) - injects into streaming sites
├── common/          # Shared library - models, settings, utilities
```

### Key Architectural Concepts

- **Message-based Communication**: Extension and client communicate via `window.postMessage`. All message types are defined in `common/src/message.ts`.
- **Command/Handler Pattern**: Extension uses handlers in `extension/src/handlers/` to process messages from different sources (video, asbplayer, popup).
- **Tab Registry**: `extension/src/services/tab-registry.ts` tracks video elements across browser tabs.
- **Settings Provider**: Unified settings system in `common/settings/settings.ts` with profile support.

## Key Files to Understand

| File | Purpose |
|------|---------|
| `common/src/message.ts` | All message types for cross-component communication |
| `common/src/model.ts` | Core data models (SubtitleModel, CardModel, etc.) |
| `common/settings/settings.ts` | Settings interfaces and keys |
| `extension/src/entrypoints/background.ts` | Extension background script, command routing |
| `extension/src/services/tab-registry.ts` | Manages video elements across tabs |
| `common/app/services/chrome-extension.ts` | Client-side extension communication |

## Development Workflows

### Setup
```bash
yarn                    # Install all workspace dependencies
```

### Running Development
```bash
# Web client
yarn workspace @project/client run start

# Extension (Chrome)
yarn workspace @project/extension run dev

# Extension (Firefox)
yarn workspace @project/extension run dev:firefox
```

### Building
```bash
# Extension
yarn workspace @project/extension run build
yarn workspace @project/extension run zip           # Chrome
yarn workspace @project/extension run zip:firefox   # Firefox
```

### Testing & Verification
```bash
yarn run verify                          # Full verification (lint, tests, type check)
yarn workspace @project/common run test  # Common package tests
yarn workspace @project/client run test  # Client tests
yarn run pretty                          # Format code with Prettier
```

## Code Patterns

### Adding a New Message Type
1. Define interface in `common/src/message.ts` extending `Message` or `MessageWithId`
2. Create handler in `extension/src/handlers/` implementing `CommandHandler`
3. Register handler in `extension/src/entrypoints/background.ts`

### Subtitle Formats
Supported formats are handled in `common/subtitle-reader/subtitle-reader.ts`:
- SRT, VTT, ASS, SUP (PGS), DFXP/TTML, YouTube formats

### Settings Changes
1. Add to appropriate interface in `common/settings/settings.ts`
2. Add key to corresponding `*SettingsKeys` array
3. Provide default value in settings provider

## Streaming Site Integrations

Site-specific scripts in `extension/src/entrypoints/`:
- `netflix-page.ts`, `youtube-page.ts`, `amazon-prime-page.ts`, etc.

These extract subtitles and inject asbplayer controls into streaming sites.

## Localization

- Translation files: `common/locales/{lang}.json`
- Uses i18next; add new keys to `en.json` first
- Verify with: `scripts/loc/loc-keys-match`

## Testing Notes

- Jest for unit tests
- Test files: `*.test.ts` alongside source files
- Run specific workspace tests: `yarn workspace @project/common run test`

## Important Conventions

- Use TypeScript strict mode
- React 19 with functional components and hooks
- MUI v6 for UI components
- Extension uses WXT framework (see `extension/wxt.config.ts`)
- Prefer `readonly` for interface properties
- Message commands use kebab-case strings
