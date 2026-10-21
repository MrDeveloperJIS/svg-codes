/* svg-codes demo. Own code, MIT (see LICENSE). */

import { generate, toSvgString, toDataURL, toPNG } from '../src/index.js';

const $ = (id) => document.getElementById(id);

const TYPES = ['qr', 'datamatrix', 'code128'];

const LABELS = {
    qr: 'QR Code',
    datamatrix: 'Data Matrix',
    code128: 'Code 128 barcode'
};

/* Byte-mode capacity of the largest QR symbol (version 40) per level. */
const QR_CAPACITY = { L: 2953, M: 2331, Q: 1663, H: 1273 };

const PADDING = {
    qr: { max: 10, unit: 'blocks' },
    datamatrix: { max: 10, unit: 'blocks' },
    code128: { max: 60, unit: 'px' }
};

const TEMPLATES = {
    url: 'https://example.com',
    wifi: 'WIFI:T:WPA;S:MyNetwork;P:my-password;;',
    vcard: [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:Jane Doe',
        'ORG:Example Inc',
        'TEL:+1234567890',
        'EMAIL:jane@example.com',
        'END:VCARD'
    ].join('\n'),
    email: 'mailto:someone@example.com?subject=Hello&body=Hi%20there',
    text: 'Hello svg-codes'
};

/* Each type remembers its own settings while you switch tabs. */
const state = {
    type: 'qr',
    colors: { fg: '#000000', bg: '#ffffff', transparent: false },
    qr: { msg: 'https://example.com', size: 256, padding: 4, ecl: 'M', mask: -1, boost: true },
    datamatrix: { msg: 'Hello svg-codes', size: 256, padding: 2, rect: false },
    code128: { msg: 'Hello svg-codes', width: 320, height: 80, padding: 16, flip: false, vertical: false }
};

const el = {
    tabs: Array.from(document.querySelectorAll('[role="tab"]')),
    panel: $('panel'),
    template: $('template'),
    msg: $('msg'),
    count: $('count'),
    hint: $('hint'),
    error: $('error'),
    size: $('size'),
    sizeOut: $('size-out'),
    sizeField: $('field-size'),
    padding: $('padding'),
    paddingOut: $('padding-out'),
    paddingLabel: $('padding-label'),
    fg: $('fg'),
    bg: $('bg'),
    transparent: $('transparent'),
    mask: $('mask'),
    boost: $('boost'),
    width: $('width'),
    height: $('height'),
    flip: $('flip'),
    vertical: $('vertical'),
    stage: $('stage'),
    placeholder: $('placeholder'),
    preview: $('preview'),
    note: $('note'),
    warnings: $('warnings'),
    snippet: $('snippet').querySelector('code'),
    copySnippet: $('copy-snippet'),
    actions: Array.from(document.querySelectorAll('[data-action]'))
};

let lastSvg = null;
let lastType = 'qr';
let renderTimer = 0;

/* ---------- Form <-> state ---------- */

function checkedValue(name) {
    const r = document.querySelector('input[name="' + name + '"]:checked');
    return r ? r.value : null;
}

function setRadio(name, value) {
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (r) {
        r.checked = r.value === String(value);
    });
}

function readForm() {
    const type = state.type;
    const s = state[type];

    s.msg = el.msg.value;
    s.padding = Number(el.padding.value);

    if (type === 'qr') {
        s.size = Number(el.size.value);
        s.ecl = checkedValue('ecl') || 'M';
        s.mask = Number(el.mask.value);
        s.boost = el.boost.checked;
    } else if (type === 'datamatrix') {
        s.size = Number(el.size.value);
        s.rect = checkedValue('shape') === 'rect';
    } else {
        s.width = Number(el.width.value);
        s.height = Number(el.height.value);
        s.flip = el.flip.checked;
        s.vertical = el.vertical.checked;
    }

    state.colors.fg = el.fg.value;
    state.colors.bg = el.bg.value;
    state.colors.transparent = el.transparent.checked;
}

function loadForm() {
    const type = state.type;
    const s = state[type];

    el.panel.setAttribute('aria-labelledby', 'tab-' + type);

    document.querySelectorAll('[data-for]').forEach(function (f) {
        f.hidden = f.dataset.for !== type;
    });
    el.sizeField.hidden = type === 'code128';

    el.msg.value = s.msg;

    const pad = PADDING[type];
    el.padding.min = 0;
    el.padding.max = pad.max;
    el.padding.value = s.padding;
    el.paddingLabel.textContent = 'Padding (' + pad.unit + ')';

    if (type === 'qr') {
        el.size.value = s.size;
        setRadio('ecl', s.ecl);
        el.mask.value = String(s.mask);
        el.boost.checked = s.boost;
    } else if (type === 'datamatrix') {
        el.size.value = s.size;
        setRadio('shape', s.rect ? 'rect' : 'square');
    } else {
        el.width.value = s.width;
        el.height.value = s.height;
        el.flip.checked = s.flip;
        el.vertical.checked = s.vertical;
    }

    el.fg.value = state.colors.fg;
    el.bg.value = state.colors.bg;
    el.transparent.checked = state.colors.transparent;

    updateOutputs();
    updateCount();
}

function updateOutputs() {
    el.sizeOut.textContent = el.size.value + ' px';
    el.paddingOut.textContent = el.padding.value + ' ' + PADDING[state.type].unit;
    el.bg.disabled = el.transparent.checked;
}

function byteLength(text) {
    return new TextEncoder().encode(text).length;
}

function updateCount() {
    const n = Array.from(el.msg.value).length;
    el.count.textContent = n + (n === 1 ? ' character' : ' characters');
}

function updateHint() {
    const s = state[state.type];
    const bytes = byteLength(s.msg);

    if (state.type === 'qr') {
        el.hint.textContent = bytes + ' bytes. Level ' + s.ecl + ' holds up to ' + QR_CAPACITY[s.ecl] +
            ' bytes (more for digits and capital letters).';
    } else if (state.type === 'datamatrix') {
        el.hint.textContent = bytes + ' bytes. Holds roughly 1,500 characters. Rectangular only fits short text ' +
            'and falls back to square when the text is longer.';
    } else {
        el.hint.textContent = 'Printable ASCII only (space to ~). Longer text needs a wider barcode to stay readable.';
    }
}

/* ---------- Options and snippet ---------- */

function buildOptions() {
    const type = state.type;
    const s = state[type];
    const colors = {
        fg: state.colors.fg,
        bg: state.colors.transparent ? 'transparent' : state.colors.bg
    };

    if (type === 'qr') {
        return {
            type: 'qr',
            msg: s.msg,
            size: s.size,
            padding: s.padding,
            colors: colors,
            qr: { ecl: s.ecl, mask: s.mask, boost: s.boost }
        };
    }

    if (type === 'datamatrix') {
        return {
            type: 'datamatrix',
            msg: s.msg,
            size: s.size,
            padding: s.padding,
            colors: colors,
            datamatrix: { rect: s.rect }
        };
    }

    return {
        type: 'code128',
        msg: s.msg,
        size: [s.width, s.height],
        padding: s.padding,
        colors: colors,
        code128: { vertical: s.vertical, flip: s.flip }
    };
}

function fmt(value, depth) {
    const pad = '  '.repeat(depth + 1);
    const end = '  '.repeat(depth);

    if (Array.isArray(value)) {
        return '[' + value.map(function (v) { return fmt(v, depth); }).join(', ') + ']';
    }
    if (value && typeof value === 'object') {
        return '{\n' + Object.keys(value).map(function (k) {
            return pad + k + ': ' + fmt(value[k], depth + 1);
        }).join(',\n') + '\n' + end + '}';
    }
    if (typeof value === 'string') {
        return "'" + value
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r') + "'";
    }
    return String(value);
}

function updateSnippet(opts) {
    el.snippet.textContent =
        "import { generate } from './src/index.js';\n\n" +
        'const svg = generate(' + fmt(opts, 0) + ');\n\n' +
        'document.body.appendChild(svg);';
}

/* ---------- Scan check warnings ---------- */

function hexToRgb(hex) {
    let h = String(hex).replace('#', '');
    if (h.length === 3) {
        h = h.split('').map(function (c) { return c + c; }).join('');
    }
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex) {
    const c = hexToRgb(hex).map(function (v) {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contrastRatio(a, b) {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* Size in px of the smallest block (module or narrowest bar). */
function moduleSize(svg) {
    if (state.type === 'code128') {
        const bars = svg.lastChild;
        const t = bars && bars.getAttribute('transform');
        const nums = t ? t.match(/-?\d+(?:\.\d+)?/g) : null;
        if (!nums) return null;
        return Math.abs(Number(state.code128.vertical ? nums[3] : nums[0]));
    }

    const vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
    const w = Number(svg.getAttribute('width'));
    if (vb.length < 4 || !vb[2] || !w) return null;
    return w / vb[2];
}

function updateWarnings(svg) {
    const items = [];
    const type = state.type;
    const s = state[type];

    if (state.colors.transparent) {
        items.push(['Transparent background.',
            'Whether this scans depends on what is behind it. Use a plain light background to be safe.']);
    } else {
        const ratio = contrastRatio(state.colors.fg, state.colors.bg);
        if (ratio < 4) {
            items.push(['Low contrast.',
                'The contrast ratio is ' + ratio.toFixed(1) + ':1. Use a darker foreground or lighter background (aim for 4:1 or more).']);
        }
        if (luminance(state.colors.fg) > luminance(state.colors.bg)) {
            items.push(['Inverted colors.',
                'Light code on a dark background. Many scanners cannot read inverted codes.']);
        }
    }

    const px = moduleSize(svg);
    if (px !== null) {
        if (type === 'code128' && px < 1.5) {
            items.push(['Bars too thin.',
                'The narrowest bar is about ' + px.toFixed(1) + ' px. Make the barcode wider or the text shorter.']);
        } else if (type !== 'code128' && px < 2) {
            items.push(['Size too small.',
                'Each block is about ' + px.toFixed(1) + ' px. Increase the size so scanners can resolve it.']);
        }
    }

    if (type === 'qr' && s.padding < 4) {
        items.push(['Small quiet zone.', 'QR codes need at least 4 blocks of padding around them.']);
    } else if (type === 'datamatrix' && s.padding < 1) {
        items.push(['No quiet zone.', 'Data Matrix codes need at least 1 block of padding around them.']);
    } else if (type === 'code128' && s.padding < 10) {
        items.push(['Small quiet zone.', 'Barcodes need about 10 px or more of padding at each end.']);
    }

    el.warnings.replaceChildren.apply(el.warnings, items.map(function (item) {
        const li = document.createElement('li');
        const strong = document.createElement('strong');
        strong.textContent = item[0];
        li.appendChild(strong);
        li.appendChild(document.createTextNode(' ' + item[1]));
        return li;
    }));
}

/* ---------- URL hash state ---------- */

function clampNum(value, min, max, fallback) {
    const n = Number(value);
    if (value === null || value === '' || !Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, Math.round(n)));
}

function hexParam(value, fallback) {
    return value && /^[0-9a-f]{6}$/i.test(value) ? '#' + value.toLowerCase() : fallback;
}

function writeHash() {
    const t = state.type;
    const s = state[t];
    const p = new URLSearchParams();

    p.set('type', t);
    if (s.msg) p.set('msg', s.msg);
    p.set('pad', String(s.padding));

    if (t === 'qr') {
        p.set('size', String(s.size));
        p.set('ecl', s.ecl);
        p.set('mask', String(s.mask));
        p.set('boost', s.boost ? '1' : '0');
    } else if (t === 'datamatrix') {
        p.set('size', String(s.size));
        p.set('rect', s.rect ? '1' : '0');
    } else {
        p.set('w', String(s.width));
        p.set('h', String(s.height));
        p.set('flip', s.flip ? '1' : '0');
        p.set('vert', s.vertical ? '1' : '0');
    }

    p.set('fg', state.colors.fg.slice(1));
    if (state.colors.transparent) p.set('tp', '1');
    else p.set('bg', state.colors.bg.slice(1));

    try {
        history.replaceState(null, '', '#' + p.toString());
    } catch (e) { /* some contexts block this; sharing links just won't update */ }
}

/* Returns true when the hash held valid settings. */
function applyHash() {
    const raw = location.hash.replace(/^#/, '');
    if (!raw) return false;

    const p = new URLSearchParams(raw);
    const type = p.get('type');
    if (TYPES.indexOf(type) === -1) return false;

    state.type = type;
    const s = state[type];

    if (p.has('msg')) s.msg = p.get('msg');
    s.padding = clampNum(p.get('pad'), 0, PADDING[type].max, s.padding);

    if (type === 'qr') {
        s.size = clampNum(p.get('size'), 64, 512, s.size);
        const ecl = (p.get('ecl') || '').toUpperCase();
        if (QR_CAPACITY[ecl]) s.ecl = ecl;
        s.mask = clampNum(p.get('mask'), -1, 7, s.mask);
        if (p.has('boost')) s.boost = p.get('boost') === '1';
    } else if (type === 'datamatrix') {
        s.size = clampNum(p.get('size'), 64, 512, s.size);
        if (p.has('rect')) s.rect = p.get('rect') === '1';
    } else {
        s.width = clampNum(p.get('w'), 1, 4000, s.width);
        s.height = clampNum(p.get('h'), 1, 4000, s.height);
        if (p.has('flip')) s.flip = p.get('flip') === '1';
        if (p.has('vert')) s.vertical = p.get('vert') === '1';
    }

    state.colors.fg = hexParam(p.get('fg'), state.colors.fg);
    state.colors.bg = hexParam(p.get('bg'), state.colors.bg);
    state.colors.transparent = p.get('tp') === '1';

    return true;
}

/* ---------- Render ---------- */

function showError(message) {
    el.error.textContent = message ? 'Error: ' + message : '';
    el.msg.setAttribute('aria-invalid', message ? 'true' : 'false');
    el.note.hidden = !(message && lastSvg);
}

function showSvg(svg, opts) {
    lastSvg = svg;
    lastType = state.type;

    const flat = opts.msg.replace(/\s+/g, ' ');
    const short = flat.length > 80 ? flat.slice(0, 80) + '…' : flat;

    el.preview.src = toDataURL(svg);
    el.preview.alt = LABELS[state.type] + ' encoding: ' + short;
    el.preview.hidden = false;
    el.placeholder.hidden = true;
    el.stage.classList.toggle('is-transparent', state.colors.transparent);

    el.actions.forEach(function (b) { b.disabled = false; });
    updateWarnings(svg);
}

function render() {
    clearTimeout(renderTimer);

    const opts = buildOptions();
    updateSnippet(opts);
    updateHint();
    writeHash();

    try {
        const svg = generate(opts);
        showError('');
        showSvg(svg, opts);
    } catch (e) {
        showError(e && e.message ? e.message : String(e));
    }
}

function schedule() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, 150);
}

/* ---------- Button feedback, clipboard, downloads ---------- */

/* Shows a short message on the button itself, then restores its label. */
function flash(btn, text) {
    if (!btn) return;
    if (btn.dataset.label === undefined) btn.dataset.label = btn.textContent;
    btn.textContent = text;
    clearTimeout(btn._flashTimer);
    btn._flashTimer = setTimeout(function () {
        btn.textContent = btn.dataset.label;
        delete btn.dataset.label;
    }, 1500);
}

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        ta.remove();
        return ok;
    }
}

function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

async function runAction(name, btn) {
    if (!lastSvg) return;
    btn = btn || document.querySelector('[data-action="' + name + '"]');
    const base = 'svg-codes-' + lastType;

    if (name === 'svg') {
        download(new Blob([toSvgString(lastSvg)], { type: 'image/svg+xml' }), base + '.svg');
    } else if (name === 'png') {
        try {
            const w = Number(lastSvg.getAttribute('width'));
            const h = Number(lastSvg.getAttribute('height'));
            const scale = Math.min(8, Math.max(1, Math.round(1024 / Math.max(w, h))));
            const blob = await toPNG(lastSvg, { scale: scale });
            download(blob, base + '.png');
        } catch (e) {
            flash(btn, 'PNG failed');
        }
    } else if (name === 'copy-svg') {
        flash(btn, await copyText(toSvgString(lastSvg)) ? 'Copied' : 'Copy failed');
    }
}

/* ---------- Tabs ---------- */

function syncTabs(focus) {
    el.tabs.forEach(function (t) {
        const on = t.dataset.type === state.type;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
    });
}

function setType(type, focus) {
    if (type === state.type) return;

    readForm();
    state.type = type;

    syncTabs(focus);
    loadForm();
    render();
}

el.tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { setType(tab.dataset.type, false); });

    tab.addEventListener('keydown', function (e) {
        const i = el.tabs.indexOf(tab);
        let next = -1;

        if (e.key === 'ArrowRight') next = (i + 1) % el.tabs.length;
        else if (e.key === 'ArrowLeft') next = (i - 1 + el.tabs.length) % el.tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = el.tabs.length - 1;

        if (next >= 0) {
            e.preventDefault();
            setType(el.tabs[next].dataset.type, true);
        }
    });
});

/* ---------- Events ---------- */

function onChange() {
    readForm();
    updateOutputs();
    updateCount();
    schedule();
}

el.panel.addEventListener('input', onChange);
el.panel.addEventListener('change', onChange);

/* Template picker: fills the text box, then goes back to the placeholder. */
el.template.addEventListener('change', function () {
    const text = TEMPLATES[el.template.value];
    el.template.value = '';
    if (text === undefined) return;

    el.msg.value = text;
    onChange();
    render();
});

el.actions.forEach(function (b) {
    b.addEventListener('click', function () { runAction(b.dataset.action, b); });
});

el.copySnippet.addEventListener('click', async function () {
    flash(el.copySnippet, await copyText(el.snippet.textContent) ? 'Copied' : 'Copy failed');
});

/* ---------- Keyboard shortcuts ---------- */

const NON_TEXT_INPUTS = ['checkbox', 'radio', 'range', 'color', 'button'];

function isTyping(target) {
    if (!target || !target.tagName) return false;
    const tag = target.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return true;
    if (tag === 'INPUT') return NON_TEXT_INPUTS.indexOf(target.type) === -1;
    return false;
}

document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
    if (isTyping(e.target)) return;

    const key = e.key.toLowerCase();

    if (key === '/') {
        e.preventDefault();
        el.msg.focus();
    } else if (key === '1' || key === '2' || key === '3') {
        setType(TYPES[Number(key) - 1], false);
    } else if (key === 's') {
        runAction('svg');
    } else if (key === 'p') {
        runAction('png');
    } else if (key === 'c') {
        runAction('copy-svg');
    }
});

/* ---------- Hash changes (back/forward or a pasted link) ---------- */

window.addEventListener('hashchange', function () {
    if (applyHash()) {
        syncTabs(false);
        loadForm();
        render();
    }
});

/* ---------- Start ---------- */

applyHash();
syncTabs(false);
loadForm();
render();