let last_time = Date.now();

function loop() {
    const now = Date.now();
    const dt = (now - last_time) / 1000;
    last_time = now;

    tick(dt);
    update_screen();

    requestAnimationFrame(loop);
}

build_base_ui();

//show_market();

update_screen();
loop();