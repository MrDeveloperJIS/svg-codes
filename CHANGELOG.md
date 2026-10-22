# Changelog

All notable changes to this project are listed here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/).

## 1.0.0 - 2026-10-22

Initial version.

### Added

- `generate()` for QR Code, Data Matrix and Code 128, always returning an SVG element.
- Unified options: `type`, `msg`, `size`, `padding`, `colors`, plus `qr`, `datamatrix` and `code128` settings.
- `CodeError` with readable messages for bad input.
- Helpers: `toSvgString`, `toDataURL`, `toPNG`.
- Original names `QRCode`, `DATAMatrix` and `BARCode` still exported.
- Single-file build, `dist/svg-codes.js`, exposing one global: `SvgCodes`.
- Demo page with live preview, SVG and PNG download, copy SVG, copy code snippet, QR templates, scan-check warnings, shareable links and keyboard shortcuts.

### Vendored

- qrcode-svg, datamatrix-svg and barcode-svg by datalog (MIT), each with only an ES module export line added.