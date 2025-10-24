-- Generate rooms for all blocks
DO $$
DECLARE
  block_record RECORD;
  floor_num INTEGER;
  room_num INTEGER;
  rooms_on_floor INTEGER;
  room_count INTEGER;
BEGIN
  FOR block_record IN SELECT id, name, total_floors, rooms_per_floor, total_rooms FROM blocks LOOP
    room_count := 0;
    
    FOR floor_num IN 1..block_record.total_floors LOOP
      -- Calculate rooms on this floor
      IF floor_num < block_record.total_floors THEN
        rooms_on_floor := block_record.rooms_per_floor;
      ELSE
        -- Last floor might have different number of rooms
        rooms_on_floor := block_record.total_rooms - (room_count);
      END IF;
      
      FOR room_num IN 1..rooms_on_floor LOOP
        room_count := room_count + 1;
        
        INSERT INTO rooms (block_id, room_number, floor_number, status, rent_amount, deposit_amount)
        VALUES (
          block_record.id,
          LPAD(room_count::TEXT, 3, '0'),
          floor_num,
          'vacant',
          CASE 
            WHEN block_record.name IN ('D', 'E') THEN 8500.00 -- Larger blocks
            WHEN block_record.name = 'H' THEN 6500.00 -- Smaller block
            ELSE 7500.00 -- Standard blocks
          END,
          CASE 
            WHEN block_record.name IN ('D', 'E') THEN 17000.00
            WHEN block_record.name = 'H' THEN 13000.00
            ELSE 15000.00
          END
        )
        ON CONFLICT (block_id, room_number) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
