// Flowdeck planning engine — C++ compiled to WebAssembly.
//
// Freestanding (no libc, no malloc): data is exchanged through fixed
// buffers in linear memory. JavaScript writes the inputs, calls an
// exported function and reads the outputs back.
//
// Build:  see build.sh  (clang++ --target=wasm32 -nostdlib ...)

#define EXPORT extern "C" __attribute__((visibility("default")))

namespace {
constexpr int MAX_TASKS = 4096;
constexpr int MAX_DAYS  = 400;
constexpr int NO_DUE    = -100000;

// ---- task inputs (one slot per task) ----
int   g_pri[MAX_TASKS];   // 1 = urgent … 4 = low
int   g_due[MAX_TASKS];   // due date as day offset from today, NO_DUE if none
float g_est[MAX_TASKS];   // estimated hours
int   g_out[MAX_TASKS];   // output: day offset chosen by the scheduler
int   g_order[MAX_TASKS]; // scratch: processing order

// ---- per-day inputs ----
float g_load[MAX_DAYS];   // hours already booked on each day (from fixed tasks)
float g_hist[MAX_DAYS];   // completions per day, oldest → newest (for insights)
float g_ins[16];          // output: insight metrics

inline float fmin_(float a, float b) { return a < b ? a : b; }
inline float fmax_(float a, float b) { return a > b ? a : b; }
inline int   imin_(int a, int b)     { return a < b ? a : b; }
inline int   imax_(int a, int b)     { return a > b ? a : b; }

// Higher score = schedule earlier.
float urgency(int i) {
    float s = (5 - g_pri[i]) * 10.0f;                 // priority: 10..40
    if (g_due[i] != NO_DUE) {
        int d = g_due[i];
        if (d <= 0)      s += 60.0f;                   // overdue / due today
        else             s += 40.0f / (float)(d + 1);  // closer deadline → higher
    }
    s += fmin_(g_est[i], 8.0f) * 0.5f;                 // big tasks start a bit earlier
    return s;
}

bool is_weekend(int dayOffset, int todayDow /*0=Mon*/) {
    int dow = (todayDow + dayOffset) % 7;
    return dow == 5 || dow == 6;
}
} // namespace

// ---- buffer accessors for JavaScript ----
EXPORT int*   pri_ptr()   { return g_pri; }
EXPORT int*   due_ptr()   { return g_due; }
EXPORT float* est_ptr()   { return g_est; }
EXPORT int*   out_ptr()   { return g_out; }
EXPORT float* load_ptr()  { return g_load; }
EXPORT float* hist_ptr()  { return g_hist; }
EXPORT float* ins_ptr()   { return g_ins; }
EXPORT int    max_tasks() { return MAX_TASKS; }
EXPORT int    max_days()  { return MAX_DAYS; }
EXPORT int    no_due()    { return NO_DUE; }

// Auto-scheduler.
// Places n tasks onto days [0, horizon) so that each day stays under
// `capacity` hours, most urgent tasks first, never after their due date
// when avoidable. Returns how many tasks had to overload a day.
EXPORT int auto_schedule(int n, int horizon, float capacity, int todayDow, int skipWeekends) {
    n = imin_(imax_(n, 0), MAX_TASKS);
    horizon = imin_(imax_(horizon, 1), MAX_DAYS);

    for (int i = 0; i < n; ++i) g_order[i] = i;

    // insertion sort by urgency (n is small, stable, no allocations)
    for (int i = 1; i < n; ++i) {
        int k = g_order[i];
        float sk = urgency(k);
        int j = i - 1;
        while (j >= 0 && urgency(g_order[j]) < sk) { g_order[j + 1] = g_order[j]; --j; }
        g_order[j + 1] = k;
    }

    int overloaded = 0;
    for (int o = 0; o < n; ++o) {
        int i = g_order[o];
        float h = g_est[i] > 0 ? g_est[i] : 1.0f;   // unestimated tasks count as 1h
        int last = horizon - 1;
        if (g_due[i] != NO_DUE) last = imin_(imax_(g_due[i], 0), horizon - 1);

        int pick = -1;
        // 1) earliest working day before the deadline with room
        for (int d = 0; d <= last; ++d) {
            if (skipWeekends && is_weekend(d, todayDow)) continue;
            if (g_load[d] + h <= capacity + 1e-4f) { pick = d; break; }
        }
        // 2) otherwise the least-loaded working day before the deadline
        if (pick < 0) {
            float best = 1e30f;
            for (int d = 0; d <= last; ++d) {
                if (skipWeekends && is_weekend(d, todayDow)) continue;
                if (g_load[d] < best) { best = g_load[d]; pick = d; }
            }
            if (pick < 0) pick = 0;  // horizon made only of weekend days
            ++overloaded;
        }
        g_load[pick] += h;
        g_out[i] = pick;
    }
    return overloaded;
}

// Productivity insights from a history of daily completions.
// Writes into ins_ptr():
//  [0] average per day        [1] 7-day average       [2] trend slope (tasks/day per day)
//  [3] current streak (days)  [4] best streak         [5] best single day
//  [6] smoothed velocity (EMA)[7] forecast days to finish `openTasks`
//  [8] momentum score 0..100  [9] active-day ratio 0..1
EXPORT void insights(int days, int openTasks) {
    days = imin_(imax_(days, 1), MAX_DAYS);
    float sum = 0, best = 0, ema = 0;
    const float alpha = 2.0f / (14.0f + 1.0f);
    int streak = 0, bestStreak = 0, active = 0;

    // least-squares slope over the window
    float sx = 0, sy = 0, sxy = 0, sxx = 0;
    for (int i = 0; i < days; ++i) {
        float v = g_hist[i];
        sum += v;
        best = fmax_(best, v);
        ema = (i == 0) ? v : alpha * v + (1 - alpha) * ema;
        if (v > 0) { ++active; ++streak; bestStreak = imax_(bestStreak, streak); }
        else streak = 0;
        sx += i; sy += v; sxy += i * v; sxx += (float)i * i;
    }
    // current streak: count back from today (allow today to still be 0)
    int cur = 0;
    for (int i = days - 1; i >= 0; --i) {
        if (g_hist[i] > 0) ++cur;
        else if (i == days - 1) continue;
        else break;
    }

    float avg = sum / days;
    int w = imin_(7, days);
    float last7 = 0;
    for (int i = days - w; i < days; ++i) last7 += g_hist[i];
    last7 /= w;

    float denom = days * sxx - sx * sx;
    float slope = denom != 0 ? (days * sxy - sx * sy) / denom : 0;

    float velocity = fmax_(ema, 0.05f);
    float forecast = openTasks / velocity;

    // momentum: recent pace vs. long-term pace, consistency and streak
    float pace = avg > 0 ? fmin_(last7 / avg, 2.0f) / 2.0f : (last7 > 0 ? 1.0f : 0.0f);
    float consistency = (float)active / days;
    float streakPart = fmin_((float)cur / 14.0f, 1.0f);
    float momentum = 100.0f * (0.45f * pace + 0.35f * consistency + 0.20f * streakPart);

    g_ins[0] = avg;      g_ins[1] = last7;   g_ins[2] = slope;
    g_ins[3] = (float)cur; g_ins[4] = (float)bestStreak; g_ins[5] = best;
    g_ins[6] = ema;      g_ins[7] = forecast; g_ins[8] = momentum;
    g_ins[9] = consistency;
}
