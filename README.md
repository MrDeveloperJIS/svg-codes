# svg-codes

QR Code, Data Matrix and Code 128 barcode generator that outputs SVG.
Pure HTML, CSS and vanilla JavaScript. No framework, no bundler, no dependencies.

**[Live demo](https://MrDeveloperJIS.github.io/svg-codes/)**

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

### As a single script tag

Build the file once (see [Development](#development)), then:

```html
<div id="out"></div>

<script src="dist/svg-codes.js"></script>
<script>
    const svg = SvgCodes.generate({ type: 'qr', msg: 'Hello' });
    document.getElementById('out').appendChild(svg);
</script>
```

The only global added is `SvgCodes`.

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

## Unified options

`generate(options)` takes one object. Only `msg` is required.

| Option | Applies to | Default | Description |
|---|---|---|---|
| `type` | all | `'qr'` | `'qr'`, `'datamatrix'` or `'code128'` (case-insensitive). |
| `msg` | all | none | Text to encode. Must be a non-empty string. |
| `size` | 2D | `256` | Height in px. Width follows the symbol shape. |
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

## Mapping to the original options

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

## Helpers

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
| `toPNG(svg, options)` | SVG element to a PNG `Blob`. Asynchronous (returns a Promise). |
| `TYPES` | `['qr', 'datamatrix', 'code128']` |
| `CodeError` | Error class used for every readable error. |
| `QRCode`, `DATAMatrix`, `BARCode` | The original generator functions, unchanged. |
| `Codes` (default export) | Object with `generate`, `toString`, `toDataURL`, `toPNG`, `TYPES`. |

In the single-file build, all of these live on `SvgCodes`
(`SvgCodes.generate`, `SvgCodes.toString`, `SvgCodes.toDataURL`, and so on).

## Error behavior

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

## Browser support

The generators build the SVG with `document.createElementNS`, so the library runs in browsers only (not in plain Node).
It needs ES module support for the module version, which every current browser has.
The single-file build runs anywhere that runs a normal `<script>` tag.

## Demo

The demo lives in [`demo/`](demo/): QR Code, Data Matrix and Code 128 tabs, live preview, downloads (SVG, PNG),
copy buttons, a code snippet for the current settings, QR templates, scan-check warnings, keyboard shortcuts and shareable links
(settings are stored in the URL hash).

## Development

Browsers do not load ES modules from `file://`, so always use a local server:

```
python -m http.server 8000
```

Then open:

| Page | Purpose |
|---|---|
| `http://localhost:8000/demo/` | The demo app. |
| `http://localhost:8000/tests.html` | Snapshot and behavior tests. |
| `http://localhost:8000/dist-test.html` | Tests the single-file build against the module version. |
| `http://localhost:8000/api-test.html` | Quick visual API check. |
| `http://localhost:8000/wrap-test.html` | Checks that the vendor files import cleanly. |

### Build the single file

```
node scripts/build.js
```

This writes `dist/svg-codes.js`. It needs plain Node and no packages.
Run it again after any change in `src/`, then open `dist-test.html` and confirm everything is green.

### Tests

`tests.html` regenerates a set of known inputs and compares each SVG string to the one saved in `tests/snapshots.js`.
After an intended change, review the codes on the page (and scan a few with a phone), press **Record snapshots**,
paste the result over `tests/snapshots.js`, and reload. Everything should be PASS.

### Updating the vendor files

Each file in `src/vendor/` is the upstream source with exactly two edits. See
[`src/vendor/WRAPPING.md`](src/vendor/WRAPPING.md). To update: download the new upstream file, repeat the two edits,
then run `tests.html` and `dist-test.html`.

## Project layout

```
svg-codes/
├─ src/
│  ├─ vendor/        original generators (export line added only)
│  ├─ adapters/      one adapter per type, plus shared helpers
│  └─ index.js       unified API (ES module)
├─ dist/
│  └─ svg-codes.js   single-file build for a plain <script> tag
├─ demo/             index.html, style.css, app.js
├─ tests/            saved snapshots
├─ licenses/         original MIT license texts
├─ scripts/          build.js
├─ tests.html        snapshot and behavior tests
└─ dist-test.html    tests for the single-file build
```

## Changelog

See [`CHANGELOG`](CHANGELOG.md) for the release history.

## License

Own code (adapters, unified API, demo, tests, build script): [MIT](LICENSE).

The generators in `src/vendor/` are by datalog, also MIT. See
[`THIRD PARTY NOTICES`](THIRD_PARTY_NOTICES.md) and [`licenses`](licenses/).