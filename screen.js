const app = document.getElementById("app");
app.classList.add("app");

// create base ui
const title = document.createElement("h1");
title.classList.add("game_title");
title.textContent = "Drug Empire Incremental";

const money_display = document.createElement("div");
money_display.classList.add("money_display");

const weed_div = document.createElement("div");
weed_div.classList.add("weed_div");

app.append(title, money_display, weed_div);




// number formatter function
function format_number(value) {
    if (!Number.isFinite(value)) return "∞";

    const sign = value < 0 ? "-" : "";
    const abs_value = Math.abs(value);

    if (abs_value < 1000) return sign + String(Math.floor(abs_value));

    const suffixes = ["k", "m", "b", "t", "qa", "qi", "sx", "sp", "oc", "no", "dc"];
    let tier = Math.floor(Math.log10(abs_value) / 3);
    if (tier < 1) tier = 1;
    if (tier > suffixes.length) tier = suffixes.length;

    const scale = Math.pow(10, tier * 3);
    let scaled = abs_value / scale;

    // Keep ~3 significant digits.
    let text;
    if (scaled >= 100) text = scaled.toFixed(0);
    else if (scaled >= 10) text = scaled.toFixed(1);
    else text = scaled.toFixed(2);

    text = text.replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");

    // If rounding pushed us to 1000, bump to next suffix.
    if (Number(text) >= 1000 && tier < suffixes.length) {
        tier += 1;
        scaled = abs_value / Math.pow(10, tier * 3);
        if (scaled >= 100) text = scaled.toFixed(0);
        else if (scaled >= 10) text = scaled.toFixed(1);
        else text = scaled.toFixed(2);
        text = text.replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");
    }

    return sign + text + suffixes[tier - 1];
}


// weed cards
const weed_cards = {};

function add_weed_type_toscreen(type) {
    if (!weeds[type]) return;
    if (weed_cards[type]) return;

    const card = document.createElement("div");
    card.classList.add("card");
    // picture frame
    const pictureframe = document.createElement("div");
    pictureframe.classList.add("pictureframe");

    const name_row = document.createElement("div");
    name_row.classList.add("weed_name_row");
    const weed_quantity_row = document.createElement("div");
    const plant_quantity_row = document.createElement("div");
    const weed_price_row = document.createElement("div");

    // buy button
    const buy_button = document.createElement("button");
    buy_button.onclick = function() {buy_plant(type)};

    // sell buttons
    const sell_button_div = document.createElement("div");
    sell_button_div.classList.add("sell_buttons");

    const sell_button = document.createElement("button");
    sell_button.onclick = function() {sell_weed(type)};
    const sell_max_button = document.createElement("button");
    sell_max_button.onclick = function() {sell_max_weed(type)};

    sell_button_div.append(sell_button, sell_max_button);

    name_row.textContent = weeds[type].name;


    // for css edits
    name_row.classList.add("weed_card_content");
    weed_quantity_row.classList.add("weed_card_content");
    plant_quantity_row.classList.add("weed_card_content");
    weed_price_row.classList.add("weed_card_content");
    buy_button.classList.add("weed_card_content");
    sell_button_div.classList.add("weed_card_content");

    card.append(pictureframe, name_row, weed_quantity_row, plant_quantity_row, weed_price_row, buy_button, sell_button_div);
    weed_div.append(card);

    weed_cards[type] = {
        pictureframe,
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

// render helper functions
function update_weed_cards() {
    for (const type in weed_cards) {
        const weed_owned = Math.floor(game.weed_owned[type]);
        const plant_owned = game.plants_owned[type];
        const price_each = weeds[type].price;
        const plant_cost = get_cost(type);

        weed_cards[type].weed_quantity_row.textContent = `Weed owned: ${format_number(weed_owned)}`;
        weed_cards[type].plant_quantity_row.textContent = `Plants owned: ${format_number(plant_owned)}`;
        weed_cards[type].weed_price_row.textContent = `Weed price: ${format_number(price_each)}`;
        weed_cards[type].buy_button.textContent = `Buy Plant for $${format_number(plant_cost)}`;
        weed_cards[type].sell_button.textContent =
            `Sell ${format_number(sell_quantity)} for $${format_number(price_each * sell_quantity)}`;
        weed_cards[type].sell_max_button.textContent =
            `Sell all for $${format_number(price_each * weed_owned)}`;
    }
}

// render screen text
function update_screen() {
    money_display.textContent = `Money: $${format_number(game.money)}`;

    update_weed_cards();
    
}
