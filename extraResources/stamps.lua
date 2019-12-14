function get_start()
	print("START")
end

function get_end()
	print("END")
end

function queue_create()
	print("CREATE")
end

mp.add_key_binding("ctrl+Q", "get_start", get_start)
mp.add_key_binding("ctrl+W", "get_end", get_end)
mp.add_key_binding("ctrl+E", "queue_create", queue_create)
