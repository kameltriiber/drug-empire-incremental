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
};

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
    }
}

function sell_max_weed(type) {
    if (game.weed_owned[type] >= 1) {
        const weedamount = Math.floor(game.weed_owned[type]);
        game.weed_owned[type] -= weedamount;
        game.money += weedamount * weeds[type].price;
    }
}

function weed_income(type, seconds) {
    return weeds[type].income * game.plants_owned[type] * seconds;
}



function tick(dt) {
    for (const type in weeds) {
        game.weed_owned[type] += weed_income(type, dt);
    }


}