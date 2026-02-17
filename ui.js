const elMoney = document.getElementById("money");
const elWeed = document.getElementById("weed");
const elPlants = document.getElementById("plants");
const elPlantCost = document.getElementById("plantcost");
const elBuyButton = document.getElementById("buybutton");
const elWeedSellButton = document.getElementById("weedsellbutton");
const elWeedAutoSell = document.getElementById("weedautosell");
const elPlantAutoBuy = document.getElementById("plantautobuy");

let lastTimeMs = Date.now();

function updateMoney() {
    elMoney.textContent = Math.floor(game.money);
}

function updateWeed() {
    elPlants.textContent = game.weed.plants;
    elPlantCost.textContent = game.weed.plantcost;
    elWeed.textContent = Math.floor(game.weed.weed);
}

function updateUI() {
    updateMoney();
    updateWeed();
}

elBuyButton.onclick = () => {
    buyplant();
    updateUI();
};

elWeedSellButton.onclick = () => {
    sellweed();
    updateUI();
}

function auto() {
    if (elWeedAutoSell.checked) sellmaxweed();
    if (elPlantAutoBuy.checked) buymaxplants();
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
