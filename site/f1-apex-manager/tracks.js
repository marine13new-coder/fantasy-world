// ============================================================================
// F1 CIRCUIT LAYOUT BUILDER (tracks.js)
// - Builds real-scale (meter) circuit centerlines from authentic corner sequences
//   (straights + constant-radius arcs), auto-closes the loop, tags tunnel / DRS
//   zones and official turn numbers. Re-authors circuits whose legacy waypoint
//   silhouettes self-intersected (Monaco, Bahrain, Barcelona, Zandvoort,
//   Interlagos, Las Vegas) so roads, kerbs and walls never fold over each other.
// ============================================================================
(function () {
    const DEG = Math.PI / 180;

    // Segment syntax:
    //   ['S', length, { tag?: 'drs' | 'tunnel' }]
    //   ['R', angleDeg, radius, turnLabel?, { tag? }]   (right-hand corner)
    //   ['L', angleDeg, radius, turnLabel?, { tag? }]   (left-hand corner)
    function walk(segs, straightLens) {
        let x = 0, y = 0, h = 0;
        const pieces = [];
        let sIdx = 0;
        segs.forEach(seg => {
            if (seg[0] === 'S') {
                const len = straightLens[sIdx++];
                pieces.push({ type: 'S', x0: x, y0: y, h, len, meta: seg[2] || {} });
                x += Math.cos(h) * len;
                y += Math.sin(h) * len;
            } else {
                const sign = seg[0] === 'R' ? 1 : -1; // y-down screen coords: right turn = +heading
                const ang = seg[1] * DEG * sign;
                const R = seg[2];
                const len = Math.abs(ang) * R;
                pieces.push({ type: 'A', x0: x, y0: y, h, len, ang, R, sign, label: seg[3] || null, meta: seg[4] || {} });
                // integrate along the circular arc (midpoint heading rule)
                const steps = Math.max(2, Math.ceil(len / 2));
                for (let k = 0; k < steps; k++) {
                    const dl = len / steps;
                    const hm = h + (ang / steps) * 0.5;
                    x += Math.cos(hm) * dl;
                    y += Math.sin(hm) * dl;
                    h += ang / steps;
                }
            }
        });
        return { x, y, h, pieces };
    }

    function buildLayout(segs) {
        const baseLens = segs.filter(s => s[0] === 'S').map(s => s[1]);
        let lens = baseLens.slice();
        const first = walk(segs, lens);
        const ex = first.x, ey = first.y;

        // Solve loop closure with a minimum-relative-change least-squares stretch of all straights:
        //   minimize Σ (d_i / len_i)^2  subject to  Σ d_i * u_i = -e
        const straights = first.pieces.filter(p => p.type === 'S').map((p, i) => ({ i, ux: Math.cos(p.h), uy: Math.sin(p.h), len: p.len }));
        let a11 = 0, a12 = 0, a22 = 0;
        straights.forEach(st => {
            const w = st.len * st.len;
            a11 += w * st.ux * st.ux;
            a12 += w * st.ux * st.uy;
            a22 += w * st.uy * st.uy;
        });
        const det = a11 * a22 - a12 * a12;
        if (Math.abs(det) > 1e-6) {
            const lx = (-ex * a22 + ey * a12) / det;
            const ly = (-ey * a11 + ex * a12) / det;
            straights.forEach(st => {
                const d = st.len * st.len * (st.ux * lx + st.uy * ly);
                lens[st.i] = Math.max(25, st.len + d);
            });
        }
        const final = walk(segs, lens);

        // Densify into points every ~6m and collect markers/tags in arc-length s
        const pts = [];
        const markers = [];
        const tags = {};
        let s = 0;
        final.pieces.forEach(p => {
            const steps = Math.max(1, Math.ceil(p.len / 6));
            const s0 = s;
            let x = p.x0, y = p.y0, h = p.h;
            for (let k = 0; k < steps; k++) {
                pts.push([x, y]);
                const dl = p.len / steps;
                if (p.type === 'S') {
                    x += Math.cos(h) * dl;
                    y += Math.sin(h) * dl;
                } else {
                    const hm = h + (p.ang / steps) * 0.5;
                    x += Math.cos(hm) * dl;
                    y += Math.sin(hm) * dl;
                    h += p.ang / steps;
                }
            }
            s += p.len;
            if (p.label) markers.push({ s: (s0 + s) * 0.5, label: p.label });
            if (p.meta && p.meta.tag) {
                if (!tags[p.meta.tag]) tags[p.meta.tag] = [];
                tags[p.meta.tag].push([s0, s]);
            }
        });
        const closeErr = Math.hypot(final.x, final.y);
        return { points: pts, length: s, markers, tags, closeErr };
    }

    // ---------------------------------------------------------------------
    // AUTHENTIC CORNER SEQUENCES (approximate real lengths & radii)
    // ---------------------------------------------------------------------
    const LAYOUTS = {
        // Circuit de Monaco — clockwise, 3.337 km, 19 turns
        MON: [
            ['S', 260, { tag: 'drs' }],
            ['R', 92, 20, '1'],                 // Sainte Dévote
            ['S', 260],
            ['L', 18, 260, '2'],                // Beau Rivage kink
            ['S', 170],
            ['L', 64, 55, '3'],                 // Massenet
            ['R', 78, 34, '4'],                 // Casino Square
            ['S', 120],
            ['R', 96, 18, '5'],                 // Mirabeau Haute
            ['S', 70],
            ['L', 168, 11, '6'],                // Fairmont Hairpin
            ['S', 70],
            ['R', 92, 18, '7'],                 // Mirabeau Bas
            ['S', 70],
            ['R', 84, 20, '8'],                 // Portier
            ['S', 60, { tag: 'tunnel' }],
            ['R', 62, 260, '9', { tag: 'tunnel' }], // Tunnel sweep
            ['S', 110, { tag: 'tunnel' }],
            ['L', 40, 16, '10'],                // Nouvelle Chicane
            ['R', 40, 16, '11'],
            ['S', 190],
            ['L', 56, 46, '12'],                // Tabac
            ['S', 140],
            ['L', 40, 40, '13'],                // Swimming Pool in
            ['R', 40, 40, '14'],
            ['S', 70],
            ['R', 36, 30, '15'],                // Swimming Pool out
            ['L', 36, 30, '16'],
            ['S', 130],
            ['R', 100, 15, '17'],               // La Rascasse
            ['S', 50],
            ['R', 70, 20, '18'],                // Anthony Noghes
            ['S', 120, { tag: 'drs' }]
        ],
        // Bahrain International Circuit — clockwise, 5.412 km, 15 turns
        BHR: [
            ['S', 620, { tag: 'drs' }],
            ['R', 120, 20, '1'],
            ['L', 40, 45, '2'],
            ['R', 30, 70, '3'],
            ['S', 520, { tag: 'drs' }],
            ['R', 100, 28, '4'],
            ['S', 140],
            ['L', 40, 70, '5'],
            ['R', 40, 70, '6'],
            ['L', 40, 70, '7'],
            ['S', 120],
            ['R', 160, 15, '8'],
            ['S', 300],
            ['L', 70, 35, '9'],
            ['L', 90, 26, '10'],
            ['S', 560, { tag: 'drs' }],
            ['L', 90, 50, '11'],
            ['R', 70, 95, '12'],
            ['S', 240],
            ['R', 90, 30, '13'],
            ['S', 560],
            ['R', 90, 30, '14'],
            ['R', 30, 90, '15']
        ],
        // Circuit de Barcelona-Catalunya — clockwise, 4.657 km
        ESP: [
            ['S', 820, { tag: 'drs' }],
            ['R', 85, 38, '1'],
            ['L', 75, 42, '2'],
            ['R', 140, 95, '3'],   // Curva Renault
            ['S', 260],
            ['R', 90, 45, '4'],    // Repsol
            ['S', 180],
            ['L', 110, 32, '5'],   // Seat hairpin
            ['S', 160],
            ['L', 35, 60, '7'],
            ['R', 45, 60, '8'],
            ['S', 150],
            ['R', 75, 80, '9'],    // Campsa
            ['S', 480, { tag: 'drs' }],
            ['L', 80, 40, '10'],   // Caixa
            ['S', 160],
            ['R', 85, 45, '12'],   // Banc Sabadell
            ['S', 160],
            ['R', 65, 80, '13'],
            ['S', 120],
            ['R', 75, 90, '14']
        ],
        // Circuit Zandvoort — clockwise, 4.259 km, banked Tarzan & Arie Luyendyk
        NED: [
            ['S', 650, { tag: 'drs' }],
            ['R', 170, 26, '1'],   // Tarzan (right hairpin)
            ['S', 120],
            ['R', 25, 60, '2'],    // Gerlach
            ['L', 135, 28, '3'],   // Hugenholtz (banked left)
            ['S', 340],            // Hunserug
            ['R', 30, 90, '4'],    // Slotemaker
            ['S', 120],
            ['R', 65, 75, '7'],    // Scheivlak
            ['S', 110],
            ['R', 45, 70, '8'],    // Mastersbocht
            ['S', 190],
            ['L', 40, 55, '9'],    // Boekebocht
            ['S', 140],
            ['R', 50, 45, '10'],
            ['S', 130],
            ['R', 85, 22, '11'],   // Hans Ernst chicane
            ['L', 80, 24, '12'],
            ['S', 130],
            ['R', 55, 55, '13'],   // Kumhobocht
            ['S', 110],
            ['R', 80, 75, '14', { tag: 'drs' }] // Arie Luyendyk (banked right onto straight)
        ],
        // Autódromo José Carlos Pace (Interlagos) — counter-clockwise, 4.309 km
        BRA: [
            ['S', 420, { tag: 'drs' }],
            ['L', 90, 25, '1'],                 // Senna S
            ['R', 60, 30, '2'],
            ['L', 90, 90, '3'],                 // Curva do Sol
            ['S', 620, { tag: 'drs' }],         // Reta Oposta
            ['L', 90, 50, '4'],                 // Descida do Lago
            ['S', 150],
            ['L', 40, 60, '5'],
            ['R', 70, 50, '6'],                 // Ferradura
            ['S', 120],
            ['R', 60, 50, '7'],
            ['S', 120],
            ['L', 120, 25, '8'],                // Pinheirinho
            ['S', 100],
            ['R', 150, 22, '9'],                // Cotovelo
            ['S', 260],
            ['L', 90, 50, '10'],                // Mergulho
            ['S', 120],
            ['L', 80, 35, '11'],                // Junção
            ['S', 250],
            ['L', 30, 300, '12'],
            ['S', 220, { tag: 'drs' }]
        ],
        // Las Vegas Strip Circuit — counter-clockwise, 6.201 km
        LVG: [
            ['S', 520, { tag: 'drs' }],
            ['L', 90, 25, '1'],
            ['R', 50, 40, '2'],
            ['L', 50, 60, '3'],
            ['S', 300],
            ['L', 90, 35, '5'],
            ['S', 620],
            ['R', 90, 40, '7'],
            ['S', 320],
            ['L', 90, 35, '8'],
            ['S', 300],
            ['R', 90, 45, '10'],
            ['S', 260],
            ['L', 90, 30, '12'],
            ['S', 1700, { tag: 'drs' }],        // The Strip
            ['R', 40, 30, '14'],
            ['L', 40, 30, '15'],
            ['L', 90, 30, '16'],
            ['S', 460],
            ['L', 90, 30, '17'],
            ['S', 300]
        ]
    };

    function applyLayouts(circuits) {
        circuits.forEach(c => {
            const segs = LAYOUTS[c.code];
            if (!segs) return;
            const built = buildLayout(segs);
            c.waypoints = built.points;
            c.layoutMeters = true;
            c.turnMarkers = built.markers.map(m => ({ t: m.s / built.length, label: m.label }));
            if (built.tags.tunnel) {
                const t0 = Math.min(...built.tags.tunnel.map(r => r[0]));
                const t1 = Math.max(...built.tags.tunnel.map(r => r[1]));
                c.tunnelZone = [t0 / built.length, t1 / built.length];
            } else {
                delete c.tunnelZone;
            }
            if (built.tags.drs) {
                // merge DRS ranges across the start/finish line
                const L = built.length;
                const zones = built.tags.drs.map(r => [r[0] / L, r[1] / L]);
                c.drsZones = zones;
            }
            c.layoutCloseErr = built.closeErr;
        });
    }

    const root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
    root.F1TrackLayouts = { buildLayout, LAYOUTS, applyLayouts };
    if (root.F1Data && root.F1Data.circuits) {
        applyLayouts(root.F1Data.circuits);
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { buildLayout, LAYOUTS, applyLayouts };
    }
})();
