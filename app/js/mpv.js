function get_stamp() {
	spot = mp.get_property_number("time-pos");
	console.log(spot);
}
mp.add_key_binding("X", "get_stamp", get_stamp);
