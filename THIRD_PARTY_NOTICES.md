# Third-party notices

`svg-codes` is built on three code generators written by
[datalog](https://github.com/datalog) and released under the MIT License.
Their code is included in this repository with only one change: an
`export` line added at the end of each file so it loads as an ES module
(see [`src/vendor/WRAPPING.md`](src/vendor/WRAPPING.md)).

The original copyright headers are kept at the top of each file.
The full license text for each project is in [`licenses/`](licenses/).

---

## qrcode-svg

- Author: datalog
- Source: https://github.com/datalog/qrcode-svg
- License: MIT ([`licenses/qrcode-svg.MIT`](licenses/qrcode-svg.MIT))
- Used from: `qrcode.min.js`
- Location in this repo: [`src/vendor/qrcode.js`](src/vendor/qrcode.js)

## datamatrix-svg

- Author: datalog
- Source: https://github.com/datalog/datamatrix-svg
- License: MIT ([`licenses/datamatrix-svg.MIT`](licenses/datamatrix-svg.MIT))
- Used from: `datamatrix.js`
- Location in this repo: [`src/vendor/datamatrix.js`](src/vendor/datamatrix.js)

## barcode-svg

- Author: datalog
- Source: https://github.com/datalog/barcode-svg
- License: MIT ([`licenses/barcode-svg.MIT`](licenses/barcode-svg.MIT))
- Used from: `barcode.js`
- Location in this repo: [`src/vendor/barcode.js`](src/vendor/barcode.js)

---

Everything outside `src/vendor/` (adapters, unified API, demo, build script) is
original work, covered by the MIT license in [`LICENSE`](LICENSE).