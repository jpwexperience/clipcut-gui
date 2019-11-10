function get_start()
	print("START")
end

function get_end()
	print("END")
end

function queue_create()
	print("CREATE")
end

mp.add_key_binding("ctrl+R", "get_start", get_start)
mp.add_key_binding("ctrl+T", "get_end", get_end)
mp.add_key_binding("ctrl+Y", "queue_create", queue_create)
