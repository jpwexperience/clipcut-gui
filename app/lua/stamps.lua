function get_start()
	local vPath = mp.get_property("path")
	local pos = mp.get_property_number("time-pos")
	print("START: ", pos)
end

function get_end()
	local pos = mp.get_property_number("time-pos")
	print("END: ", pos)
end

mp.add_key_binding("R", "get_start", get_start)
mp.add_key_binding("T", "get_end", get_end)
