// market.js
// Owns ALL market state + price algorithm. UI is optional.

const volatility = {
    basic: 0.1,
    california: 0.05,
    special: 0.03,
};

const mean_revert_mult = {
    basic: 0.01,
    california: 0.02,
    special: 0.03,
};

const mean_revert2 = {
    basic: 0.05,
    california: 0.25,
    special: 1.25,
};

function now_sec() {
    return Math.floor(Date.now() / 1000);
}

function clamp(x, lo, hi) {
    return Math.max(lo, Math.min(hi, x));
}

function market_base_price(type) {
    return {
        basic: 1,
        california: 5,
        special: 25,
    }[type] ?? 1;
}

// Make sure game.market exists + has entries for every weed type
function market_init_if_needed() {
    if (!game.market) {
        game.market = {
            history_limit: 1000,
            tick_interval: 1,
            tick_accum: 0,
            prices: {},
        };
    }
    if (!game.market.prices) game.market.prices = {};

    for (const type in weeds) {
        if (!game.market.prices[type]) {
            const start_price = weeds[type].price;
            game.market.prices[type] = { last: start_price, history: [] };
        }
    }
}

// Append a price point into *saved* history (capped)
function market_record_price(type, price, t = now_sec()) {
    market_init_if_needed();

    const entry = game.market.prices[type];
    const safe_time = Number.isFinite(t) ? Math.floor(t) : now_sec();
    const safe_price = Number.isFinite(price) && price > 0
        ? Math.round(price * 100) / 100
        : market_base_price(type);

    entry.last = safe_price;

    const hist = entry.history;
    const last = hist[hist.length - 1];
    if (last && last.time === safe_time) {
        // Same second: overwrite to avoid duplicate timestamps in setData().
        last.value = safe_price;
    } else if (last && last.time > safe_time) {
        // Keep time strictly increasing even if called with stale timestamps.
        hist.push({ time: last.time + 1, value: safe_price });
    } else {
        hist.push({ time: safe_time, value: safe_price });
    }

    const limit = game.market.history_limit || 1000;
    if (entry.history.length > limit) {
        entry.history.splice(0, entry.history.length - limit);
    }

    // keep weeds[type].price as the "current displayed price"
    // weeds[type].price = safe_price;

    // If chart exists, sync it from capped saved history.
    if (window.push_price_point) push_price_point(type);
}

// Simple starter algorithm: mean-reverting random walk per weed.
// You can replace this later with your “bots + circular economy” logic.
function market_next_price(type) {
    const entry = game.market.prices[type];

    // Baselines can be your original prices (or something you evolve later)
    const base = game.market.market_price?.[type] ?? market_base_price(type);

    const p = entry.last ?? base;

    // Tune per weed
    const vol = volatility[type] ?? 0.04;

    const mean_revert = mean_revert_mult[type] ?? 0.02;
    const mean_revert_2 = mean_revert2[type];

    // noise ~ [-1, +1]
    const noise = (Math.random() * 2 - 1);

    // mean reversion toward base + random shock
    const drift = (base - p) * mean_revert;

    let drift2 = 0;
    const delta = base - p;
    if (delta > 0.5 * base) {
        drift2 = mean_revert_2;
    } else if (delta < -0.5 * base) {
        drift2 = -mean_revert_2;
    } else {
        drift2 = 0;
    }

    const shock = p * vol * noise;

    let next = p + drift2 + shock;

    // Don't allow 0 or negative prices
    next = clamp(next, 0.05, Infinity);

    // Keep it readable (optional)
    next = Math.round(next * 100) / 100;

    return next;
}



let market_bot_setprice_timer = {
    basic: 0,
    california: 0,
    special: 0,
}



function market_trading_bot_setprice(type, price, time) {
    market_bot_setprice_timer[type] = time;
    game.market.market_price[type] = price;
}

function market_trading_bot_push(type) {
    if (game.market.bots[type].number <= 0) return;
    if (game.market.bots[type].cooldown > 0) return;
    game.market.bots[type].cooldown = 120;

    const number = game.market.bots[type].number;
    const level = game.market.bots[type].level;
    const current_price = game.market.prices[type].last;
    const base_price = market_base_price(type);

    // number of bots indicate push_price target price
    // level indicates amount of time

    const time = (level + 1) * 5;
    const target_price = current_price * 2 + base_price * number;
    market_trading_bot_setprice(type, target_price, time);
}



function bot_tick(dt) {
    for (const type in game.market.bots) {
        // cooldowns / timers
        if (market_bot_setprice_timer[type] > 0) {
            if (market_bot_setprice_timer[type] - dt < 0) {
                market_bot_setprice_timer[type] = 0;
            } else {
                market_bot_setprice_timer[type] -= dt;
            }
        }
        if (game.market.bots[type].cooldown > 0) {
            if (game.market.bots[type].cooldown - dt < 0) {
                game.market.bots[type].cooldown = 0;
            } else {
                game.market.bots[type].cooldown -= dt;
            }
        }

        // reset market_price if timer is 0
        if (market_bot_setprice_timer[type] === 0) {
            game.market.market_price[type] = weeds[type].price;
        }
    }
}

// Called from main tick(dt)
function market_tick(dt) {
    market_init_if_needed();

    // Only run market mechanics after unlock (optional)
    if (!game.unlocks.market) return;

    game.market.tick_accum += dt;

    const interval = game.market.tick_interval || 1;
    while (game.market.tick_accum >= interval) {
        game.market.tick_accum -= interval;

        // const t = now_sec();
        for (const type in weeds) {
            const next = market_next_price(type);
            market_record_price(type, next);
        }
    }
}

// Fill one type history with its base price.
function market_seed_type_history_with_base_price(type, points = 60) {
    market_init_if_needed();
    if (!weeds[type] || !game.market.prices[type]) return;

    const safe_points = Math.max(0, Math.floor(points));
    const entry = game.market.prices[type];
    const base = market_base_price(type);
    const t0 = now_sec() - safe_points;

    entry.history = [];
    for (let i = safe_points; i > 0; i--) {
        const t = t0 + (safe_points - i);
        entry.history.push({ time: t, value: base });
    }

    const limit = game.market.history_limit || 1000;
    if (entry.history.length > limit) {
        entry.history.splice(0, entry.history.length - limit);
    }

    entry.last = base;
    weeds[type].price = base;
}
