const basic_weed = {
    basic_plants: 0,
    basic_weed_income: 0,
    basic_weed: 0,
    basic_weed_price: 1,
    basic_plantcost: 10,
    maxbasic_plants: 1000,
}

const weed = {
    basic_weed,
};

const game = {
    money: 10,
    weed,
};

function basic_weed_income() {
    return game.weed.basic_weed.basic_plants;
}

function buybasic_plant() {
    if (game.money < game.weed.basic_weed.basic_plantcost) return;
    if (game.weed.basic_weed.basic_plants >= game.weed.basic_weed.maxbasic_plants) return;
    game.money -= game.weed.basic_weed.basic_plantcost;
    game.weed.basic_weed.basic_plants += 1;
    return;
}

function buymaxbasic_plants() {
    if (game.money < game.weed.basic_weed.basic_plantcost) return;
    if (game.weed.basic_weed.basic_plants >= game.weed.basic_weed.maxbasic_plants) return;
    const plantcount = Math.min((Math.floor(game.money / game.weed.basic_weed.basic_plantcost)), (game.weed.basic_weed.maxbasic_plants - game.weed.basic_weed.basic_plants));
    game.weed.basic_weed.basic_plants += plantcount;
    game.money -= plantcount * game.weed.basic_weed.basic_plantcost;
    return;
}

function sellbasic_weed() {
    if (game.weed.basic_weed.basic_weed < 1) return;
    game.weed.basic_weed.basic_weed -= 1;
    game.money += game.weed.basic_weed.basic_weed_price;
    return;
}

function sellmaxbasic_weed() {
    if (game.weed.basic_weed.basic_weed < 1) return;
    const allbasic_weed = Math.floor(game.weed.basic_weed.basic_weed);
    game.money += allbasic_weed * game.weed.basic_weed.basic_weed_price;
    game.weed.basic_weed.basic_weed -= allbasic_weed;
    return;
}

function tick(dt) {
    game.weed.basic_weed.basic_weed += basic_weed_income() * dt;
    
}
