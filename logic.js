const game = {
    money: 10,
    plants_owned: {
        basic: 0,
        california: 0,
        special: 0,
    },
    weed_owned: {
        basic: 0,
        california: 0,
        special: 0,
    },
    unlocks: {
        market: false,
        leverage: false,
    },
    stats: {
        lifetime_money_earned: 0,
        lifetime_weed_sold: {
            basic: 0,
            california: 0,
            special: 0,
        },
    },
    market: {
        // keep this small + serializable (safe for future saving)
        history_limit: 1000,
        tick_interval: 1,     // seconds between price points
        tick_accum: 0,        // internal accumulator for timing

        prices: {
            basic:      { last: 1,  history: [] },
            california: { last: 5,  history: [] },
            special:    { last: 25, history: [] },
        },
    },
};

function checkpoint_market() {
    return game.stats.lifetime_money_earned >= 10000;
}

function checkpoint_leverage() {
    return game.stats.lifetime_money_earned >= 100000;
}

let sell_quantity = 1;

function get_cost(type) {
    const w = weeds[type];
    const owned = game.plants_owned[type];
    return Math.floor(w.base_cost * Math.pow(w.cost_mult, owned));
}

function buy_plant(type) {
    const cost = get_cost(type);
    if (game.money >= cost) {
        game.money -= cost;
        game.plants_owned[type]++;
    }
}

function sell_weed(type) {
    if (game.weed_owned[type] >= sell_quantity) {
        game.weed_owned[type] -= sell_quantity;
        game.money += sell_quantity * weeds[type].price;
        game.stats.lifetime_money_earned += sell_quantity * weeds[type].price;
        game.stats.lifetime_weed_sold[type] += sell_quantity;
    }
}

function sell_max_weed(type) {
    if (game.weed_owned[type] >= 1) {
        const weedamount = Math.floor(game.weed_owned[type]);
        game.weed_owned[type] -= weedamount;
        game.money += weedamount * weeds[type].price;
        game.stats.lifetime_money_earned += weedamount * weeds[type].price;
        game.stats.lifetime_weed_sold[type] += weedamount;
    }
}

function weed_income(type, seconds) {
    return weeds[type].income * game.plants_owned[type] * seconds;
}

function unlock_market() {
    // seed each type history with its base price so charts start non-empty
    for (const type in weeds) {
        market_seed_type_history_with_base_price(type, 1000);
    }
    show_market();
}

function unlock_leverage() {
    show_leverage();
}

function check_unlocks() {
    if (!game.unlocks.market && checkpoint_market()) {
        game.unlocks.market = true;
        unlock_market();
    }
    if (!game.unlocks.leverage && checkpoint_leverage()) {
        game.unlocks.leverage = true;
        unlock_leverage();
    }
}

function tick(dt) {
    for (const type in weeds) {
        game.weed_owned[type] += weed_income(type, dt);
    }

    check_unlocks();

    market_tick(dt);

}
