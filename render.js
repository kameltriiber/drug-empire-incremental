let last_time = Date.now();

function loop() {
    const now = Date.now();
    const dt = (now - last_time) / 1000;
    last_time = now;

    tick(dt);
    update_screen();

    requestAnimationFrame(loop);
}

const loaded = load_game();
if (loaded) game = loaded;

market_init_if_needed();

build_base_ui();

if (game.unlocks.market) show_market();
if (game.unlocks.leverage) show_leverage();

setup_autosave(); // optional

update_screen();
loop();