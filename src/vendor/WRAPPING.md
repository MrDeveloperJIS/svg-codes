# Vendor wrapping notes

Each file in this folder is the upstream source with exactly two edits:

1. One comment line directly below the original copyright header:
   `/* Modified only to export as ES module (export line added at the end). */`
2. One export line appended at the very end of the file.

| File | Upstream source | Export line added |
|---|---|---|
| `qrcode.js` | `qrcode.min.js` from datalog/qrcode-svg | `export { QRCode };` |
| `datamatrix.js` | `datamatrix.js` from datalog/datamatrix-svg | `export { DATAMatrix };` |
| `barcode.js` | `barcode.js` from datalog/barcode-svg | `export { BARCode };` |

No code inside the functions is changed. The upstream files only declare a
function and never write to `window`, so nothing else needs removing.

To update from upstream: download the new file, then repeat the two edits above.