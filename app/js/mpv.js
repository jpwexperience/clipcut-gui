function on_pause_change(name, value) {
    if (value == true)
        mp.set_property("fullscreen", "no");
}

function get_time() {
	var spot = mp.get_property_number("time-pos");
}

mp.observe_property("pause", "bool", on_pause_change);

mp.add_key_binding("R", 'Timestamp', get_time())
