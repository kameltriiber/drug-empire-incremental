const elMoney = document.getElementById("money");
const elbasic_weed = document.getElementById("basic_weed");
const elbasic_Plants = document.getElementById("basic_plants");
const elbasic_PlantCost = document.getElementById("basic_plantcost");
const elbasic_BuyButton = document.getElementById("basic_buybutton");
const elbasic_weedSellButton = document.getElementById("basic_weedsellbutton");
const elbasic_weedAutoSell = document.getElementById("basic_weedautosell");
const elbasic_PlantAutoBuy = document.getElementById("basic_plantautobuy");

let lastTimeMs = Date.now();

function updateMoney() {
    elMoney.textContent = Math.floor(game.money);
}

function updatebasic_weed() {
    elbasic_Plants.textContent = game.weed.basic_weed.basic_plants;
    elbasic_PlantCost.textContent = game.weed.basic_weed.basic_plantcost;
    elbasic_weed.textContent = Math.floor(game.weed.basic_weed.basic_weed);
}

function updateUI() {
    updateMoney();
    updatebasic_weed();
}

elbasic_BuyButton.onclick = () => {
    buybasic_plant();
    updateUI();
};

elbasic_weedSellButton.onclick = () => {
    sellbasic_weed();
    updateUI();
}

function auto() {
    if (elbasic_weedAutoSell.checked) sellmaxbasic_weed();
    if (elbasic_PlantAutoBuy.checked) buymaxbasic_plants();
}

function loop() {
    const now = Date.now();
    const dt = (now - lastTimeMs) / 1000;
    lastTimeMs = now;

    tick(dt);
    auto();
    updateUI();

    requestAnimationFrame(loop);
}

updateUI();
loop();
