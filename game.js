const weed = {
    plants: 0,
    weedincome: 0,
    weed: 0,
    weedprice: 10,
    plantcost: 10,
}

const game = {
    money: 10,
    weed,
};

function weedincome() {
    return game.weed.plants;
}

function buyplant() {
    if (game.money < game.weed.plantcost) return;
    game.money -= game.weed.plantcost;
    game.weed.plants += 1;
    return;
}

function buymaxplants() {
    if (game.money < game.weed.plantcost) return;
    const plantcount = Math.floor(game.money / game.weed.plantcost);
    game.weed.plants += plantcount;
    game.money -= plantcount * game.weed.plantcost;
    return;
}

function sellweed() {
    if (game.weed.weed < 1) return;
    game.weed.weed -= 1;
    game.money += game.weed.weedprice;
    return;
}

function sellmaxweed() {
    if (game.weed.weed < 1) return;
    game.money += Math.floor(game.weed.weed) * game.weed.weedprice;
    game.weed.weed -= Math.floor(game.weed.weed);
    return;
}

function tick(dt) {
    game.weed.weed += weedincome() * dt;
    
}
