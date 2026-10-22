# svg-codes

QR Code, Data Matrix and Code 128 barcode generator that outputs SVG.
Pure HTML, CSS and vanilla JavaScript. No framework, no bundler, no dependencies.

**[Live demo](https://MrDeveloperJIS.github.io/svg-codes/)**

## Contents

- [Credits](#credits)
- [Features](#features)
- [Installation](#installation)
- [Quick start](#quick-start)
- [API reference](#api-reference)
- [Guide to each code type](#guide-to-each-code-type)
- [Error handling](#error-handling)
- [Recipes](#recipes)
- [Demo app](#demo-app)
- [Troubleshooting](#troubleshooting)
- [Browser support](#browser-support)
- [Development](#development)
- [Project layout](#project-layout)
- [Changelog](#changelog)
- [License](#license)

## Credits

The three generators underneath are written by
[datalog](https://github.com/datalog) and released under the MIT License:

- [qrcode-svg](https://github.com/datalog/qrcode-svg)
- [datamatrix-svg](https://github.com/datalog/datamatrix-svg)
- [barcode-svg](https://github.com/datalog/barcode-svg)

`svg-codes` adds one unified API, input validation, helpers and a demo page on top of them.
Their license texts are in [`licenses/`](licenses/) and details are in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## Features

- One function, `generate()`, for all three code types.
- Always returns an `SVGElement`.
- One consistent option format (the originals disagree on names and units).
- Readable error messages for bad input (`CodeError`).
- Helpers: SVG text, data URL, PNG blob.
- Transparent background support.
- Works as an ES module or as a single `<script>` tag.
- Original function names (`QRCode`, `DATAMatrix`, `BARCode`) are still exported.

## Installation

There is no package to install. Copy the files into your project, or clone the repository.

| You want | Copy this | Use it with |
|---|---|---|
| ES module, separate files | the `src/` folder | `import { generate } from './src/index.js'` |
| One file, plain script tag | `dist/svg-codes.js` | `<script src="svg-codes.js">`, global `SvgCodes` |

`dist/svg-codes.js` is already built and committed. You only need to build it yourself
after changing something in `src/` (see [Development](#development)).

## Quick start

### As an ES module

```html
<div id="out"></div>

<script type="module">
    import { generate } from './src/index.js';

    const svg = generate({ type: 'qr', msg: 'https://example.com', size: 256 });
    document.getElementById('out').appendChild(svg);
</script>
```

Browsers do not load ES modules from `file://`. Open the page through a web server
(see [Development](#development)).

### As a single script tag

```html
<div id="out"></div>

<script src="dist/svg-codes.js"></script>
<script>
    const svg = SvgCodes.generate({ type: 'qr', msg: 'Hello' });
    document.getElementById('out').appendChild(svg);
</script>
```

The only global added is `SvgCodes`. This version also works from `file://`.

### Examples

```js
// QR Code, high error correction, custom colors
generate({
    type: 'qr',
    msg: 'https://example.com',
    size: 300,
    padding: 4,
    colors: { fg: '#0c0c0c', bg: '#f0f8ff' },
    qr: { ecl: 'H' }
});

// Data Matrix, rectangular, transparent background
generate({
    type: 'datamatrix',
    msg: 'Hello',
    colors: { bg: 'transparent' },
    datamatrix: { rect: true }
});

// Code 128, 400 x 100 px, mirrored bars
generate({
    type: 'code128',
    msg: 'ABC-12345',
    size: [400, 100],
    code128: { flip: true }
});

// Code 128, vertical
generate({
    type: 'code128',
    msg: 'Hello',
    size: { width: 80, height: 240 },
    code128: { vertical: true }
});
```

## API reference

### `generate(options)`

Returns an `SVGElement`. Throws a [`CodeError`](#error-handling) on bad input.
Only `msg` is required.

#### Options

| Option | Applies to | Default | Description |
|---|---|---|---|
| `type` | all | `'qr'` | `'qr'`, `'datamatrix'` or `'code128'` (case-insensitive). |
| `msg` | all | none | Text to encode. Must be a non-empty string. |
| `size` | QR, Data Matrix | `256` | Height in px. Width follows the symbol shape. |
| `size` | Code 128 | `[320, 80]` | `[width, height]`, `{ width, height }`, or one number `n` (becomes `n` wide and `n / 4` high). |
| `padding` | QR | `4` | Quiet zone in blocks. |
| `padding` | Data Matrix | `2` | Quiet zone in blocks. |
| `padding` | Code 128 | `[20, 16]` | Quiet zone in px. One number `n` becomes `[n, n]`, or pass `[x, y]`. |
| `colors.fg` | all | `'#000'` | Foreground. Hex only: `#rgb` or `#rrggbb`. |
| `colors.bg` | all | `'#fff'` | Background. Hex, or `'transparent'` (also `'none'`, `''`, `null`, `false`). |
| `qr.ecl` | QR | `'M'` | Error correction: `'L'`, `'M'`, `'Q'` or `'H'`. |
| `qr.mask` | QR | `-1` | `-1` picks the best mask automatically, or `0` to `7`. |
| `qr.boost` | QR | `true` | Raise the error correction level when space allows. |
| `qr.verbose` | QR | `false` | Draw one path piece per block (larger SVG). |
| `datamatrix.rect` | Data Matrix | `false` | Rectangular symbol. Only used for short text; longer text falls back to square. |
| `datamatrix.verbose` | Data Matrix | `false` | Draw one path piece per block (larger SVG). |
| `code128.vertical` | Code 128 | follows `size` | `true` draws vertical bars. When omitted, the code is vertical if height is greater than width. |
| `code128.flip` | Code 128 | `false` | Mirror the bars. |

Code 128 uses character set B: printable ASCII only (space to `~`).

### Helpers

```js
import {
    generate, toSvgString, toDataURL, toPNG,
    TYPES, CodeError
} from './src/index.js';

const svg = generate({ type: 'qr', msg: 'Hello' });

toSvgString(svg);                         // '<svg viewBox="0 0 ...'
toDataURL(svg);                           // 'data:image/svg+xml;charset=utf-8,...'

const blob = await toPNG(svg, {
    scale: 2,                             // multiplies the pixel size, default 1
    background: '#ffffff'                 // optional fill behind the code
});
```

| Export | Description |
|---|---|
| `generate(options)` | Returns an `SVGElement`. Throws `CodeError` on bad input. |
| `toSvgString(svg)` | SVG element to SVG text. Also exported as `toString`. |
| `toDataURL(svg)` | SVG element to a data URL for `<img src>` or downloads. |
| `toPNG(svg, options)` | SVG element to a PNG `Blob`. Asynchronous (returns a Promise). Rejects with `CodeError` if `scale` is not a number above 0 or the image cannot be drawn. |
| `TYPES` | `['qr', 'datamatrix', 'code128']` |
| `CodeError` | Error class used for every readable error. |
| `QRCode`, `DATAMatrix`, `BARCode` | The original generator functions, unchanged. |
| `Codes` (default export) | Object with `generate`, `toString`, `toDataURL`, `toPNG`, `TYPES`. |

`toPNG` options:

| Option | Default | Description |
|---|---|---|
| `scale` | `1` | Multiplies the SVG's pixel width and height. Must be above 0. |
| `background` | none | CSS color painted behind the code. Without it the PNG keeps a transparent background. |

In the single-file build, all of these live on `SvgCodes`
(`SvgCodes.generate`, `SvgCodes.toString`, `SvgCodes.toDataURL`, and so on).
The `QRCode`, `DATAMatrix` and `BARCode` names are on `SvgCodes` too, but they are not added to `window`.

### Mapping to the original options

If you already know the upstream generators, this table shows how each unified option maps to them.

| Unified | `QRCode` | `DATAMatrix` | `BARCode` |
|---|---|---|---|
| `msg` | `msg` | `msg` | `msg` |
| `size` | `dim` (number) | `dim` (number) | `dim` `[width, height]` |
| `padding` | `pad` (blocks) | `pad` (blocks) | `pad` `[x, y]` (px) |
| `colors.fg`, `colors.bg` | `pal` `[fg, bg]` | `pal` `[fg, bg]` | `pal` `[fg, bg]` |
| `qr.ecl` | `ecl` | n/a | n/a |
| `qr.boost` | `ecb` (1 or 0) | n/a | n/a |
| `qr.mask` | `mtx` | n/a | n/a |
| `qr.verbose` / `datamatrix.verbose` | `vrb` | `vrb` | n/a |
| `datamatrix.rect` | n/a | `rct` (1 or 0) | n/a |
| `code128.vertical` | n/a | n/a | set by swapping width and height in `dim` |
| `code128.flip` | n/a | n/a | not supported upstream; the adapter rewrites the bars' transform |

A transparent background is passed to the originals by leaving `bg` out of `pal`.

## Guide to each code type

### QR Code

- Best for URLs, Wi-Fi details, contacts and short text.
- `qr.ecl` trades capacity for damage tolerance: `L` holds the most data, `H` survives the most damage.
- `qr.boost` (on by default) quietly raises the level when the text is short enough that it costs nothing.
- Leave `qr.mask` at `-1` unless you have a reason; the generator picks the best mask itself.
- Keep `padding` at 4 blocks or more. Scanners need that empty border.
- Too much text throws a `CodeError`. The largest symbol holds about 2,953 bytes at level `L` and 1,273 bytes at level `H`.

### Data Matrix

- Compact 2D code, common for small labels and parts marking.
- Holds roughly 1,500 characters.
- `datamatrix.rect` asks for a rectangular symbol. It only works for short text and falls back to square for longer text.
- Keep at least 1 block of `padding`.

### Code 128

- 1D barcode for ASCII text such as order numbers and SKUs.
- Printable ASCII only (space to `~`). Anything else throws a `CodeError` that names the character.
- `size` is `[width, height]` in px. Longer text needs a wider barcode, otherwise the bars become too thin to scan.
- `padding` is in px, not blocks. The default is `[20, 16]` (20 px at each end, 16 px top and bottom).
- Vertical bars: set `code128.vertical: true`, or give a `size` that is taller than it is wide. The adapter swaps width and height if they disagree with the setting.
- `code128.flip` mirrors the bars.

## Error handling

Every problem with the input throws a `CodeError` with a plain message you can show to a user:

```js
try {
    generate({ type: 'code128', msg: 'café' });
} catch (e) {
    console.log(e.name);     // 'CodeError'
    console.log(e.message);  // 'Code 128 cannot encode the "é" (U+00E9). Use printable ASCII characters only (space to ~).'
}
```

Cases that are checked:

- Empty or non-string text.
- Unknown `type` (the message lists the allowed types).
- Text too long for QR or Data Matrix with the chosen settings.
- Characters Code 128 cannot encode (the message names the character).
- Invalid colors, QR level, QR mask, size or padding.
- Code 128 padding that is too large for the size.

## Recipes

### Show a code inside an `<img>`

```js
const img = document.createElement('img');
img.src = toDataURL(generate({ type: 'qr', msg: 'Hello' }));
document.body.appendChild(img);
```

### Download as SVG

```js
const svg = generate({ type: 'qr', msg: 'Hello' });
const blob = new Blob([toSvgString(svg)], { type: 'image/svg+xml' });

const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = 'code.svg';
a.click();
URL.revokeObjectURL(a.href);
```

### Download as PNG

```js
const svg = generate({ type: 'qr', msg: 'Hello', size: 256 });
const blob = await toPNG(svg, { scale: 4, background: '#ffffff' });

const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = 'code.png';
a.click();
URL.revokeObjectURL(a.href);
```

### Show a friendly message on bad input

```js
try {
    container.replaceChildren(generate({ type: 'qr', msg: input.value }));
} catch (e) {
    if (e instanceof CodeError) message.textContent = e.message;
    else throw e;
}
```

## Demo app

The demo lives in [`demo/`](demo/) and runs live at the link at the top.

- QR Code, Data Matrix and Code 128 tabs. Each tab remembers its own settings.
- Live preview that updates as you type. If the text becomes invalid, the last valid code stays visible with an error message.
- Downloads: **Download SVG** and **Download PNG** (scaled up to about 1024 px on the longest side).
- Copy buttons: **Copy SVG** and **Copy snippet**.
- A code snippet showing the `generate()` call for the current settings.
- QR templates: URL, Wi-Fi, vCard, Email and Plain text.
- Scan-check warnings for low contrast, inverted colors, a transparent background, blocks or bars that are too small, and a missing quiet zone.

### Keyboard shortcuts

Shortcuts are off while you type in a field.

| Key | Action |
|---|---|
| `/` | Focus the text box |
| `1` `2` `3` | QR Code, Data Matrix, Barcode |
| `S` | Download SVG |
| `P` | Download PNG |
| `C` | Copy SVG |

### Shareable links

The settings are stored in the URL hash, so you can copy the address bar to share an exact setup.

| Parameter | Meaning |
|---|---|
| `type` | `qr`, `datamatrix` or `code128` |
| `msg` | The text to encode |
| `pad` | Padding (blocks for 2D, px for Code 128) |
| `size` | Size in px (QR and Data Matrix) |
| `ecl`, `mask`, `boost` | QR error correction level, mask `-1` to `7`, boost `1` or `0` |
| `rect` | Data Matrix rectangular, `1` or `0` |
| `w`, `h` | Code 128 width and height in px |
| `flip`, `vert` | Code 128 mirror and vertical, `1` or `0` |
| `fg`, `bg` | Colors as six hex digits without `#` |
| `tp` | `1` for a transparent background (then `bg` is left out) |

Example: `demo/#type=qr&msg=Hello&size=256&ecl=M&fg=000000&bg=ffffff`

## Troubleshooting

**The demo or my module page is blank, with a CORS or module error in the console.**
Browsers block ES modules on `file://`. Serve the folder with a local web server, or use `dist/svg-codes.js` with a normal script tag.

**`generate` is not defined.**
With the script-tag build everything is on the global: use `SvgCodes.generate(...)`.

**Nothing appears on the page.**
`generate()` only returns the element. You must add it yourself, for example with `container.appendChild(svg)`.

**`document is not defined` in Node.**
The generators build SVG with the DOM, so the library runs in browsers only.

**A Data Matrix is square even though `rect: true`.**
Rectangular symbols only fit short text. Longer text falls back to square.

**Code 128 throws a "cannot encode" error.**
Only printable ASCII (space to `~`) is supported. The message names the character that failed.

**A code does not scan.**
Check the demo's scan-check warnings: contrast of at least 4:1, dark code on a light background, enough padding, and large enough blocks or bars.

## Browser support

The generators build the SVG with `document.createElementNS`, so the library runs in browsers only (not in plain Node).
It needs ES module support for the module version, which every current browser has.
The single-file build runs anywhere that runs a normal `<script>` tag.
`toPNG` additionally needs canvas support.

## Development

Browsers do not load ES modules from `file://`, so always use a local server:

```
python -m http.server 8000
```

Then open `http://localhost:8000/demo/`.

### Build the single file

```
node scripts/build.js
```

This writes `dist/svg-codes.js`. It needs plain Node and no packages.
Run it again after any change in `src/`, and commit the new file.
The script checks that every import is in the build list and in the right order,
and that the result parses as a plain script.

### Checking a change

There is no automated test suite. After a change:

1. Run `node scripts/build.js`.
2. Open the demo and generate each of the three types.
3. Scan a few of the codes with a phone.
4. Try bad input (empty text, too much text, `café` in Code 128) and confirm the error message is readable.

### Updating the vendor files

Each file in `src/vendor/` is the upstream source with exactly two edits. See
[`src/vendor/WRAPPING.md`](src/vendor/WRAPPING.md). To update: download the new upstream file,
repeat the two edits, rebuild with `node scripts/build.js`, then check the demo as described above.

### Hosting the demo

The repository is ready for GitHub Pages: the root `index.html` redirects to `demo/`,
and `.nojekyll` makes Pages serve the files as they are.

## Project layout

```
svg-codes/
├─ src/
│  ├─ vendor/        original generators (export line added only), plus WRAPPING.md
│  ├─ adapters/      one adapter per type, plus shared helpers
│  └─ index.js       unified API (ES module)
├─ dist/
│  └─ svg-codes.js   single-file build for a plain <script> tag
├─ demo/             index.html, style.css, app.js
├─ licenses/         original MIT license texts
├─ scripts/
│  └─ build.js       builds dist/svg-codes.js
├─ index.html        redirects to demo/
├─ favicon.ico
├─ .nojekyll         tells GitHub Pages to skip Jekyll
├─ CHANGELOG.md
├─ THIRD_PARTY_NOTICES.md
├─ LICENSE
└─ README.md
```

## Changelog

See [`CHANGELOG`](CHANGELOG.md) for the version history.

## License

Own code (adapters, unified API, demo, build script): [MIT](LICENSE).

The generators in `src/vendor/` are by datalog, also MIT. See
[`THIRD PARTY NOTICES`](THIRD_PARTY_NOTICES.md) and [`licenses`](licenses/).