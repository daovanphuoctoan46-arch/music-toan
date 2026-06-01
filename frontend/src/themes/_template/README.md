# Creating a Custom Theme

Follow these 6 steps to create a new theme for Cosmic Aura Player:

1. **Copy Folder**: Copy `src/themes/_template/` to a new folder (e.g., `src/themes/my-cool-theme/`).
2. **Update Manifest**: Edit `manifest.json` with your theme's `id`, `name`, and other metadata.
3. **Implement Logic**: Edit `index.js` and implement the 5 required methods (`mount`, `destroy`, `onAudioFrame`, `onBeat`, `onPaletteChange`).
4. **Style Theme**: Edit `layout.css` to add your custom styles.
5. **Add Preview**: Add a `preview.jpg` (1024x768) to your theme folder.
6. **Register Theme**: Import and register your theme in `src/main.js`:

```javascript
import MyCoolTheme from './themes/my-cool-theme';
themeManager.registerTheme('my-cool-theme', MyCoolTheme);
```

## Theme Contract
Your theme class must extend `BaseTheme` and follow the lifecycle methods:
- `mount(container)`: Initialize your theme.
- `onAudioFrame(data)`: Receive real-time audio features (60fps).
- `onBeat()`: Triggered on every beat.
- `onPaletteChange(palette)`: Receive new colors from album art.
- `destroy()`: Cleanup everything.
