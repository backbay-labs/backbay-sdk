# @backbay/glia-desktop

Desktop OS shell components for React — window management, taskbar, start menu, notifications, and file browser.

Part of the [Backbay SDK](https://github.com/backbay/backbay-sdk).

## Installation

```bash
npm install @backbay/glia-desktop
```

## Usage

```typescript
// Full desktop shell
import { DesktopOSProvider, Desktop, Taskbar, Window } from "@backbay/glia-desktop";

// Headless hooks for custom UI
import { useWindowManager, useTaskbar, useNotifications } from "@backbay/glia-desktop/core";

// Themes
import { defaultTheme } from "@backbay/glia-desktop/themes";
```

### Quick Start

```tsx
import { DesktopOSProvider, Desktop, Taskbar } from "@backbay/glia-desktop";

function App() {
  return (
    <DesktopOSProvider processes={myApps} theme={myTheme}>
      <Desktop />
      <Taskbar />
    </DesktopOSProvider>
  );
}
```

## Exports

| Entry Point | Description |
|---|---|
| `@backbay/glia-desktop` | All components, hooks, and themes |
| `@backbay/glia-desktop/core` | Headless hooks and Zustand store factories |
| `@backbay/glia-desktop/themes` | Built-in desktop themes |

## Architecture

State management uses Zustand with a factory + context pattern:

- `createWindowManagerStore()` — factory for custom instances
- `useWindowManagerStore` — direct store access
- `WindowManagerStoreProvider` — React context provider

The same pattern applies to Taskbar, StartMenu, SystemTray, Notifications, SnapZones, and FileBrowser.

## Peer Dependencies

- `react` ^18 or ^19
- `framer-motion` ^12

## License

MIT
