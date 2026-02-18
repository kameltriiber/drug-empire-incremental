const app = document.getElementById("app");

// create base ui
const title = document.createElement("h1");
title.textContent = "Drug Empire Incremental";

const money_display = document.createElement("div");
const weed_div = document.createElement("div");

app.append(title, money_display, weed_div);

const weed_cards = {};

function add_weed_type_toscreen(type) {
    if (!weeds[type]) return;
    if (weed_cards[type]) return;

    const card = document.createElement("div");
    card.classList.add("card");
    const name_row = document.createElement("div");
    const weed_quantity_row = document.createElement("div");
    const plant_quantity_row = document.createElement("div");
    const weed_price_row = document.createElement("div");

    // buy button
    const buy_button = document.createElement("button");
    buy_button.onclick = function() {buy_plant(type)};

    // sell button
    const sell_button = document.createElement("button");
    sell_button.onclick = function() {sell_weed(type)};
    const sell_max_button = document.createElement("button");
    sell_max_button.onclick = function() {sell_max_weed(type)};

    name_row.textContent = weeds[type].name;

    card.append(name_row, weed_quantity_row, plant_quantity_row, weed_price_row, buy_button, sell_button, sell_max_button);
    weed_div.append(card);

    weed_cards[type] = {
        weed_quantity_row,
        plant_quantity_row,
        weed_price_row,
        buy_button,
        sell_button,
        sell_max_button,
    };
}

for (const type in weeds) {
    add_weed_type_toscreen(type);
}

// render screen text
function update_screen() {
    money_display.textContent = `Money: ${Math.floor(game.money)}`;

    for (const type in weed_cards) {
        weed_cards[type].weed_quantity_row.textContent = `Weed owned: ${Math.floor(game.weed_owned[type])}`;
        weed_cards[type].plant_quantity_row.textContent = `Plants owned: ${game.plants_owned[type]}`;
        weed_cards[type].weed_price_row.textContent = `Weed price: ${weeds[type].price}`;
        weed_cards[type].buy_button.textContent = `Buy Plant for ${get_cost(type)}`;
        weed_cards[type].sell_button.textContent = `Sell ${sell_quantity} Weed for ${weeds[type].price * sell_quantity}`;
        weed_cards[type].sell_max_button.textContent = `Sell ${Math.floor(game.weed_owned[type])} Weed for ${weeds[type].price * Math.floor(game.weed_owned[type])}`;
    }
}
