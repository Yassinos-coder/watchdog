# Source maps

Production code is minified, so a raw stack trace points at `main.a3f9.js:1:48211`. Upload source maps and Watchdog shows your original file, line and the code around it.

## Upload from your build

1. Make sure your build emits source maps (`build.sourcemap: true` in Vite, `sourceMap: true` in `tsconfig.json`).
2. Copy the **upload token** from **Project settings → Source maps**.
3. After the build, run:

```bash
WATCHDOG_URL=https://your-watchdog-host \
WATCHDOG_PROJECT_ID=<project id> \
WATCHDOG_UPLOAD_TOKEN=<upload token> \
bunx @watchdog-sdk/cli sourcemaps upload ./dist --release 1.0.0
```

The `release` must match the `release` you pass to the SDK. Watchdog matches maps by release and file path.

## Tips

- Embed sources in the maps (`sourcesContent`) so the code lines can be shown without access to your repository. Most bundlers do this by default.
- You can safely delete `.map` files from the public folder after uploading so visitors cannot download them.
- Upload tokens only allow uploading. Generating a new token revokes the old one.
