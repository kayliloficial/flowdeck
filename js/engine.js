/* Flowdeck engine bridge
   Loads the C++ planning engine (WebAssembly, embedded in engine-wasm.js) synchronously,
   and exposes a small JS API. If WebAssembly is unavailable, an equivalent JS
   implementation is used so the app keeps working everywhere. */
(function () {
  const Engine = { backend: 'js', ready: false };
  let ex = null;

  try {
    if (window.FLOWDECK_WASM && typeof WebAssembly === 'object') {
      const bin = Uint8Array.from(atob(window.FLOWDECK_WASM), c => c.charCodeAt(0));
      ex = new WebAssembly.Instance(new WebAssembly.Module(bin), {}).exports;
      Engine.backend = 'wasm';
    }
  } catch (e) { console.warn('[Flowdeck] WebAssembly engine unavailable, using JS fallback', e); ex = null; }
  Engine.ready = true;

  const NO_DUE = ex ? ex.no_due() : -100000;

  /* tasks: [{priority, dueOffset|null, est}], load: Float array of hours already booked per day
     returns {days:[offset per task], overloaded} */
  Engine.schedule = function (tasks, load, opts) {
    const n = tasks.length, horizon = load.length;
    const cap = opts.capacity, dow = opts.todayDow, skip = opts.skipWeekends ? 1 : 0;
    if (ex) {
      const m = ex.memory.buffer;
      const pri = new Int32Array(m, ex.pri_ptr(), n), due = new Int32Array(m, ex.due_ptr(), n), est = new Float32Array(m, ex.est_ptr(), n);
      const ld = new Float32Array(m, ex.load_ptr(), horizon);
      tasks.forEach((t, i) => { pri[i] = t.priority; due[i] = t.dueOffset == null ? NO_DUE : t.dueOffset; est[i] = t.est || 0; });
      ld.set(load);
      const over = ex.auto_schedule(n, horizon, cap, dow, skip);
      return { days: Array.from(new Int32Array(ex.memory.buffer, ex.out_ptr(), n)), overloaded: over, load: Array.from(new Float32Array(ex.memory.buffer, ex.load_ptr(), horizon)) };
    }
    // ---- JS fallback (same algorithm as cpp/planner.cpp) ----
    const L = Array.from(load), urg = t => (5 - t.priority) * 10 + (t.dueOffset == null ? 0 : t.dueOffset <= 0 ? 60 : 40 / (t.dueOffset + 1)) + Math.min(t.est || 0, 8) * .5;
    const we = d => skip && [5, 6].includes((dow + d) % 7), out = new Array(n); let over = 0;
    tasks.map((t, i) => i).sort((a, b) => urg(tasks[b]) - urg(tasks[a])).forEach(i => {
      const t = tasks[i], h = t.est > 0 ? t.est : 1, last = t.dueOffset == null ? horizon - 1 : Math.min(Math.max(t.dueOffset, 0), horizon - 1);
      let pick = -1;
      for (let d = 0; d <= last; d++) if (!we(d) && L[d] + h <= cap + 1e-4) { pick = d; break; }
      if (pick < 0) { let best = Infinity; for (let d = 0; d <= last; d++) if (!we(d) && L[d] < best) { best = L[d]; pick = d; } if (pick < 0) pick = 0; over++; }
      L[pick] += h; out[i] = pick;
    });
    return { days: out, overloaded: over, load: L };
  };

  /* hist: completions per day oldest→newest. returns metrics object */
  Engine.insights = function (hist, openTasks) {
    let r;
    if (ex) {
      new Float32Array(ex.memory.buffer, ex.hist_ptr(), hist.length).set(hist);
      ex.insights(hist.length, openTasks);
      r = Array.from(new Float32Array(ex.memory.buffer, ex.ins_ptr(), 10));
    } else {
      const n = hist.length, a = 2 / 15; let sum = 0, best = 0, ema = 0, st = 0, bs = 0, act = 0, sx = 0, sy = 0, sxy = 0, sxx = 0;
      hist.forEach((v, i) => { sum += v; best = Math.max(best, v); ema = i ? a * v + (1 - a) * ema : v; if (v > 0) { act++; st++; bs = Math.max(bs, st) } else st = 0; sx += i; sy += v; sxy += i * v; sxx += i * i; });
      let cur = 0; for (let i = n - 1; i >= 0; i--) { if (hist[i] > 0) cur++; else if (i === n - 1) continue; else break; }
      const avg = sum / n, w = Math.min(7, n), l7 = hist.slice(n - w).reduce((x, y) => x + y, 0) / w, den = n * sxx - sx * sx, slope = den ? (n * sxy - sx * sy) / den : 0;
      const pace = avg > 0 ? Math.min(l7 / avg, 2) / 2 : (l7 > 0 ? 1 : 0), cons = act / n;
      r = [avg, l7, slope, cur, bs, best, ema, openTasks / Math.max(ema, .05), 100 * (.45 * pace + .35 * cons + .2 * Math.min(cur / 14, 1)), cons];
    }
    return { avg: r[0], last7: r[1], slope: r[2], streak: r[3], bestStreak: r[4], bestDay: r[5], velocity: r[6], forecastDays: r[7], momentum: r[8], consistency: r[9] };
  };

  window.Engine = Engine;
})();
