const ui = {
    app: null,
    money_display: null,
    weed_div: null,
    weed_cards: {},
    market_div: null,
    market_weed_counter_div: null,
    market_weed_counter: {},
    market_chart_basic_div: null,
    market_chart_elements: {},
    market_charts: {},


    market_chart_california_div: null,
    market_chart_special_div: null,


    leverage_div: null,
};

// create base ui
function build_base_ui() {
    // app container
    ui.app = document.getElementById("app");
    ui.app.classList.add("app");

    // if gets called twice
    ui.app.innerHTML = ""; 

    // title
    const title = document.createElement("h1");
    title.classList.add("game_title");
    title.textContent = "Drug Empire Incremental";

    // money display
    ui.money_display = document.createElement("div");
    ui.money_display.classList.add("money_display");

    // weed container
    ui.weed_div = document.createElement("div");
    ui.weed_div.classList.add("weed_div");

    //add all into app container
    ui.app.append(title, ui.money_display, ui.weed_div);

    // data inside of weedcards
    ui.weed_cards = {};

    // add all types of weed and their data to the ui.weed_cards / render to screen
    for (const type in weeds) {
        add_weed_type_to_screen(type);
    }

    // market panel
    ui.market_div = document.createElement("div");
    ui.market_div.classList.add("market_div");
    ui.market_div.classList.add("hidden");
    ui.app.append(ui.market_div);

    // weed quantities
    ui.market_weed_counter_div = document.createElement("div");
    ui.market_weed_counter_div.classList.add("market_weed_counter_div");
    ui.market_div.append(ui.market_weed_counter_div);

    ui.market_weed_counter = {};
    
    for (const type in weeds) {
        add_counter_to_market(type);
    }

    // market chart basic
    ui.market_chart_basic_div = document.createElement("div");
    ui.market_chart_basic_div.classList.add("market_chart_div");
    ui.market_div.append(ui.market_chart_basic_div);

    add_market_chart("basic");
    add_market_chart("california");
    add_market_chart("special");
    

}


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


// actually create weed cards and add to ui 
function add_weed_type_to_screen(type) {
    if (!weeds[type]) return;
    if (ui.weed_cards[type]) return;

    const card = document.createElement("div");
    card.classList.add("card");

    // picture frame
    const pictureframe = document.createElement("div");
    pictureframe.classList.add("pictureframe");

    // text content
    const name_row = document.createElement("div");
    name_row.classList.add("weed_name_row");
    const weed_quantity_row = document.createElement("div");
    const plant_quantity_row = document.createElement("div");
    const weed_price_row = document.createElement("div");
    name_row.textContent = weeds[type].name;

    // buttons
    const buy_button = document.createElement("button");
    buy_button.onclick = function() {buy_plant(type)};
    const buy_button_line = document.createElement("div");
    buy_button_line.textContent = "Buy Plant: ";

    const sell_button = document.createElement("button");
    sell_button.onclick = function() {sell_weed(type)};
    const sell_button_line = document.createElement("div");
    sell_button_line.textContent = "Sell 1 Weed: ";

    const sell_max_button = document.createElement("button");
    sell_max_button.onclick = function() {sell_max_weed(type)};
    const sell_max_button_line = document.createElement("div");
    sell_max_button_line.textContent = "Sell all Weed: ";

    // divs for button layout
    const buy_button_div = document.createElement("div");
    buy_button_div.append(buy_button_line, buy_button);
    buy_button_div.classList.add("button_div");

    const sell_button_div = document.createElement("div");
    sell_button_div.append(sell_button_line, sell_button);
    sell_button_div.classList.add("button_div");
    sell_button_div.classList.add("stage_1_sell_button_div");

    const sell_max_button_div = document.createElement("div");
    sell_max_button_div.append(sell_max_button_line, sell_max_button);
    sell_max_button_div.classList.add("button_div");
    sell_max_button_div.classList.add("stage_1_sell_button_div");

    // added classes for css edits
    name_row.classList.add("weed_card_content");
    weed_quantity_row.classList.add("weed_card_content");
    plant_quantity_row.classList.add("weed_card_content");
    weed_price_row.classList.add("weed_card_content");
    buy_button_div.classList.add("weed_card_content");
    sell_button_div.classList.add("weed_card_content");
    sell_max_button_div.classList.add("weed_card_content");

    // add everything to the card div
    card.append(pictureframe, name_row, weed_quantity_row, plant_quantity_row, weed_price_row, buy_button_div, sell_button_div, sell_max_button_div);
    ui.weed_div.append(card);

    // "saving" data in the cards
    ui.weed_cards[type] = {
        pictureframe,
        weed_quantity_row,
        plant_quantity_row,
        weed_price_row,
        buy_button,
        sell_button,
        sell_max_button,
    };
}

function add_counter_to_market(type) {
    if (!weeds[type]) return;
    if (ui.market_weed_counter[type]) return;

    const counter = document.createElement("div");
    counter.classList.add("market_weed_counter");
    counter.classList.add("level2");

    ui.market_weed_counter[type] = counter;
    ui.market_weed_counter_div.append(counter);
}

function add_market_chart(type) {
    if (!weeds[type]) return;
    if (ui.market_chart_elements[type]) return;

    const chart_package = document.createElement("div");
    chart_package.classList.add("market_chart_package");
    
    const graph_chart_div = document.createElement("div")
    graph_chart_div.classList.add("market_graph_chart_div");
    graph_chart_div.classList.add("level2");

    const graph_control_div = document.createElement("div");
    graph_control_div.classList.add("market_graph_control_div");
    graph_control_div.classList.add("level2");

    chart_package.append(graph_chart_div);
    chart_package.append(graph_control_div);

    const graph_chart_container = document.createElement("div");
    graph_chart_container.classList.add("market_graph_chart");
    graph_chart_container.id = `price_chart_${type}`;
    graph_chart_div.append(graph_chart_container);

    ui.market_chart_elements[type] = {
        chart_package,
        graph_chart_div,
        graph_control_div,
        graph_chart_container,
    };

    ui.market_chart_basic_div.append(chart_package);
}

function create_price_chart(type, container_id) {
    const container = document.getElementById(container_id);
    const chart = LightweightCharts.createChart(container, {
        width: 655,
        height: 420,
        timeScale: {
            timeVisible: true,
            secondsVisible: true,
        },
        layout: {
            background: {
                type: 'solid',
                color: 'hsl(110, 5%, 94%)'
            },
        }

    });
    const price_series = chart.addLineSeries();

    // hydrate from saved history if present
    if (game.market && game.market.prices && game.market.prices[type]) {
        const hist = game.market.prices[type].history;
        if (hist && hist.length) price_series.setData(hist);
    }

    ui.market_charts[type] = {
        chart,
        price_series,
    };
}

function push_price_point(type, price = null, time = null) {
    const chart_data = ui.market_charts[type];
    if (!chart_data) return;

    const market_entry = game.market?.prices?.[type];
    const value = price ?? market_entry?.last;
    if (typeof value !== "number") return;

    const t = time ?? Math.floor(Date.now() / 1000);
    chart_data.price_series.update({ time: t, value });
}

function show_market() {
    // deactivate stage 1 sell buttons
    document.querySelectorAll(".stage_1_sell_button_div")
        .forEach(el => el.classList.add("hidden"));
    
    // make market panel visible
    ui.market_div.classList.remove("hidden");

    //create charts
    create_price_chart("basic", "price_chart_basic");
    create_price_chart("california", "price_chart_california");
    create_price_chart("special", "price_chart_special");
}

function show_leverage() {

}

// render helper functions
function update_weed_cards() {
    for (const type in ui.weed_cards) {
        const weed_owned = Math.floor(game.weed_owned[type]);
        const plant_owned = game.plants_owned[type];
        const price_each = weeds[type].price;
        const plant_cost = get_cost(type);

        ui.weed_cards[type].weed_quantity_row.textContent = `Weed owned: ${format_number(weed_owned)}`;
        ui.weed_cards[type].plant_quantity_row.textContent = `Plants owned: ${format_number(plant_owned)}`;
        ui.weed_cards[type].weed_price_row.textContent = `Weed price: ${format_number(price_each)}`;
        ui.weed_cards[type].buy_button.textContent = `$${format_number(plant_cost)}`;
        ui.weed_cards[type].sell_button.textContent =
            `$${format_number(price_each * sell_quantity)}`;
        ui.weed_cards[type].sell_max_button.textContent =
            `$${format_number(price_each * weed_owned)}`;
    }
}

function update_market_weed_counter() {
    for (const type in ui.market_weed_counter) {
        const weed_owned = Math.floor(game.weed_owned[type]);
        const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);
        ui.market_weed_counter[type].textContent = `${typeCapitalized} Weed: ${format_number(weed_owned)}`;
    }
}

// render screen text
function update_screen() {
    ui.money_display.textContent = `Money: $${format_number(game.money)}`;

    update_weed_cards();

    update_market_weed_counter();
}