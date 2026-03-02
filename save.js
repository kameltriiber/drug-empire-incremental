// save.js
// Minimal localStorage save/load for Drug Empire Incremental.
// Designed for MVP: no UI state saved, only gameplay state.
// load_game() returns a *new* game object (or null) so you can do: game = load_game() ?? game;
//
// Recommended usage in render.js (before build_base_ui / loop):
//   const loaded = load_game();
//   if (loaded) game = loaded;
//   market_init_if_needed();
//   build_base_ui();
//   if (game.unlocks.market) show_market();
//   if (game.unlocks.leverage) show_leverage();
//   setup_autosave();  (optional)

(() => {
    const SAVE_KEY = "drug_empire_incremental_save";
    const SAVE_VERSION = 1;

    let saving_disabled = false;
    let autosave_interval_id = null;
    let autosave_hooks_installed = false;

    // How much market history to keep per weed type in the save.
    // Set to 0 to omit history entirely (keeps only last price).
    const MARKET_HISTORY_SAVE_LIMIT = 500;

    function isObj(x) {
        return x !== null && typeof x === "object" && x.constructor === Object;
    }

    function num(x, fallback = 0) {
        const n = Number(x);
        return Number.isFinite(n) ? n : fallback;
    }

    function int(x, fallback = 0) {
        const n = Number(x);
        return Number.isFinite(n) ? Math.floor(n) : fallback;
    }

    // Build a fresh default state that matches your current game structure.
    // This is used to fill missing fields when loading older/broken saves.
    function default_game_state() {
        const types = (typeof weeds !== "undefined") ? Object.keys(weeds) : ["basic", "california", "special"];

        const plants_owned = {};
        const weed_owned = {};
        const lifetime_sold = {};
        const lifetime_collected = {};
        const market_prices = {};
        const market_price = {};
        const bots = {};

        for (const t of types) {
            plants_owned[t] = 0;
            weed_owned[t] = 0;
            lifetime_sold[t] = 0;
            lifetime_collected[t] = 0;

            const base = (typeof market_base_price === "function") ? market_base_price(t) : (weeds?.[t]?.price ?? 1);
            market_prices[t] = { last: base, history: [] };
            market_price[t] = base;
            bots[t] = { number: 0, level: 1, cooldown: 120 };
        }

        return {
            money: 10,
            plants_owned,
            weed_owned,
            unlocks: { market: false, leverage: false },
            stats: {
                lifetime_money_earned: 0,
                lifetime_weed_sold: lifetime_sold,
                lifetime_weed_collected: lifetime_collected,
            },
            market: {
                history_limit: 500,
                tick_interval: 1,
                tick_accum: 0, // reset on load
                prices: market_prices,
                market_price,
                bots,
            },
        };
    }

    // Copy only serializable gameplay state (no DOM, no chart objects).
    function build_save_payload() {
        const g = (typeof game !== "undefined" && game) ? game : default_game_state();
        const types = (typeof weeds !== "undefined") ? Object.keys(weeds) : Object.keys(g.weed_owned || { basic: 0, california: 0, special: 0 });

        const payload = {
            v: SAVE_VERSION,
            saved_at: Date.now(),
            game: default_game_state(),
            globals: {},
        };

        // Money + main inventories
        payload.game.money = num(g.money, 10);

        for (const t of types) {
            payload.game.plants_owned[t] = int(g.plants_owned?.[t], 0);
            payload.game.weed_owned[t] = num(g.weed_owned?.[t], 0);

            payload.game.stats.lifetime_weed_sold[t] = num(g.stats?.lifetime_weed_sold?.[t], 0);
            payload.game.stats.lifetime_weed_collected[t] = num(g.stats?.lifetime_weed_collected?.[t], 0);
        }

        payload.game.unlocks.market = !!g.unlocks?.market;
        payload.game.unlocks.leverage = !!g.unlocks?.leverage;

        payload.game.stats.lifetime_money_earned = num(g.stats?.lifetime_money_earned, 0);

        // Market: preserve last prices and (optionally) limited history
        payload.game.market.history_limit = int(g.market?.history_limit, 500);
        payload.game.market.tick_interval = num(g.market?.tick_interval, 1);
        payload.game.market.tick_accum = 0; // do not persist timing accumulator

        for (const t of types) {
            const entry = g.market?.prices?.[t];
            const last = num(entry?.last, payload.game.market.prices[t].last);
            payload.game.market.prices[t].last = last;
            payload.game.market.market_price[t] = num(
                g.market?.market_price?.[t],
                (typeof market_base_price === "function") ? market_base_price(t) : payload.game.market.market_price[t]
            );

            if (g.market?.bots?.[t]) {
                payload.game.market.bots[t] = {
                    number: int(g.market.bots[t].number, 0),
                    level: int(g.market.bots[t].level, 1),
                    cooldown: num(g.market.bots[t].cooldown, 60),
                };
            } else {
                payload.game.market.bots[t] = { number: 0, level: 1, cooldown: 60 };
            }

            // History can be a little large; keep it bounded.
            if (MARKET_HISTORY_SAVE_LIMIT > 0 && Array.isArray(entry?.history)) {
                const hist = entry.history;
                const slice = hist.length > MARKET_HISTORY_SAVE_LIMIT
                    ? hist.slice(hist.length - MARKET_HISTORY_SAVE_LIMIT)
                    : hist.slice();

                // Ensure entries are {time:number,value:number} (lightweight-charts format)
                payload.game.market.prices[t].history = slice
                    .filter(p => p && typeof p === "object")
                    .map(p => ({ time: int(p.time, 0), value: num(p.value, last) }))
                    .filter(p => p.time > 0 && Number.isFinite(p.value));
            } else {
                payload.game.market.prices[t].history = [];
            }
        }

        // Save gameplay-relevant globals (not UI)
        if (typeof sell_quantity !== "undefined") payload.globals.sell_quantity = int(sell_quantity, 1);
        if (typeof market_quantity !== "undefined" && isObj(market_quantity)) {
            const mq = {};
            for (const t of types) mq[t] = int(market_quantity[t], 1);
            payload.globals.market_quantity = mq;
        }
        if (typeof market_fee !== "undefined") payload.globals.market_fee = num(market_fee, 0.02);

        return payload;
    }

    function save_game() {
        if (saving_disabled) return false;
        try {
            const payload = build_save_payload();
            localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
            return true;
        } catch (e) {
            console.warn("save_game failed:", e);
            return false;
        }
    }

    // Merge SOURCE into TARGET recursively (mutates target). Arrays are replaced.
    function deepMergeInto(target, source) {
        if (!isObj(target) || !isObj(source)) return;
        for (const k of Object.keys(source)) {
            const sv = source[k];
            const tv = target[k];

            if (Array.isArray(sv)) {
                target[k] = sv.slice();
            } else if (isObj(sv) && isObj(tv)) {
                deepMergeInto(tv, sv);
            } else {
                target[k] = sv;
            }
        }
    }

    // Load from storage and return a *new* game object (or null).
    // It also restores globals (sell_quantity, market_quantity, market_fee) if present.
    function load_game() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;

            const parsed = JSON.parse(raw);
            if (!parsed || parsed.v !== SAVE_VERSION || !parsed.game) return null;

            const base = default_game_state();
            deepMergeInto(base, parsed.game);

            // Fixups: ensure required nested structures exist for all weed types
            const types = (typeof weeds !== "undefined") ? Object.keys(weeds) : Object.keys(base.weed_owned || { basic: 0, california: 0, special: 0 });
            for (const t of types) {
                if (base.plants_owned[t] == null) base.plants_owned[t] = 0;
                if (base.weed_owned[t] == null) base.weed_owned[t] = 0;

                if (!base.stats) base.stats = {};
                if (!base.stats.lifetime_weed_sold) base.stats.lifetime_weed_sold = {};
                if (!base.stats.lifetime_weed_collected) base.stats.lifetime_weed_collected = {};
                if (base.stats.lifetime_weed_sold[t] == null) base.stats.lifetime_weed_sold[t] = 0;
                if (base.stats.lifetime_weed_collected[t] == null) base.stats.lifetime_weed_collected[t] = 0;

                if (!base.market) base.market = default_game_state().market;
                if (!base.market.prices) base.market.prices = {};
                if (!base.market.prices[t]) {
                    const baseP = (typeof market_base_price === "function") ? market_base_price(t) : (weeds?.[t]?.price ?? 1);
                    base.market.prices[t] = { last: baseP, history: [] };
                }
                if (!base.market.market_price) base.market.market_price = {};
                // Baseline market prices are the static "basic prices", not the current live price.
                base.market.market_price[t] = (typeof market_base_price === "function")
                    ? market_base_price(t)
                    : num(base.market.market_price[t], 1);

                if (!base.market.bots) base.market.bots = {};
                if (!base.market.bots[t]) {
                    base.market.bots[t] = { number: 0, level: 1, cooldown: 60 };
                }
            }

            // Reset accumulator (avoid huge dt loops after load)
            base.market.tick_accum = 0;

            // Restore globals
            if (parsed.globals && isObj(parsed.globals)) {
                if (typeof sell_quantity !== "undefined" && parsed.globals.sell_quantity != null) {
                    sell_quantity = int(parsed.globals.sell_quantity, sell_quantity);
                }
                if (typeof market_quantity !== "undefined" && isObj(parsed.globals.market_quantity)) {
                    for (const k of Object.keys(parsed.globals.market_quantity)) {
                        market_quantity[k] = int(parsed.globals.market_quantity[k], market_quantity[k] ?? 1);
                    }
                }
                if (typeof market_fee !== "undefined" && parsed.globals.market_fee != null) {
                    market_fee = num(parsed.globals.market_fee, market_fee);
                }
            }

            return base;
        } catch (e) {
            console.warn("load_game failed:", e);
            return null;
        }
    }

    function has_save() {
        try {
            return !!localStorage.getItem(SAVE_KEY);
        } catch {
            return false;
        }
    }

    function delete_save() {
        try {
            localStorage.removeItem(SAVE_KEY);
            return true;
        } catch (e) {
            console.warn("delete_save failed:", e);
            return false;
        }
    }

    // Optional: simple autosave helpers (call from render.js if you want)
    function setup_autosave(interval_ms = 5000) {
        stop_autosave();

        autosave_interval_id = window.setInterval(save_game, Math.max(1000, int(interval_ms, 5000)));

        if (!autosave_hooks_installed) {
            autosave_hooks_installed = true;

            document.addEventListener("visibilitychange", () => {
                if (document.visibilityState === "hidden") save_game();
            });

            window.addEventListener("beforeunload", () => {
                save_game();
            });
        }
    }

    function stop_autosave() {
        if (autosave_interval_id !== null) {
            clearInterval(autosave_interval_id);
            autosave_interval_id = null;
        }
    }

    window.setup_autosave = setup_autosave;
    window.stop_autosave = stop_autosave;

    function reset_game_and_reload() {
        // Prevent any final "beforeunload" autosave from recreating the save.
        saving_disabled = true;

        // Stop interval-based autosave too.
        stop_autosave();

        // Delete the save now.
        delete_save();

        // Reload next tick (gives the browser a moment to commit localStorage changes).
        setTimeout(() => location.reload(), 0);
    }

    window.reset_game_and_reload = reset_game_and_reload;

    // Expose globally
    window.save_game = save_game;
    window.load_game = load_game;
    window.has_save = has_save;
    window.delete_save = delete_save;
    window.setup_autosave = setup_autosave;
})();
