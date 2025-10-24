-- Insert main property
INSERT INTO properties (name, address) 
VALUES ('RentFlow Apartments', 'Nairobi, Kenya')
ON CONFLICT DO NOTHING;

-- Get property ID
DO $$
DECLARE
  prop_id INTEGER;
BEGIN
  SELECT id INTO prop_id FROM properties WHERE name = 'RentFlow Apartments' LIMIT 1;

  -- Insert Block A: 224 rooms (28 per floor, 8 floors)
  INSERT INTO blocks (property_id, name, total_floors, rooms_per_floor, total_rooms)
  VALUES (prop_id, 'A', 8, 28, 224)
  ON CONFLICT DO NOTHING;

  -- Insert Block B: 231 rooms (28 per floor for 7 floors + 7 on 8th floor)
  INSERT INTO blocks (property_id, name, total_floors, rooms_per_floor, total_rooms)
  VALUES (prop_id, 'B', 8, 28, 231)
  ON CONFLICT DO NOTHING;

  -- Insert Block C: 224 rooms (28 per floor, 8 floors)
  INSERT INTO blocks (property_id, name, total_floors, rooms_per_floor, total_rooms)
  VALUES (prop_id, 'C', 8, 28, 224)
  ON CONFLICT DO NOTHING;

  -- Insert Block D: 358 rooms (42 per floor for 8 floors + 8 on 9th floor)
  INSERT INTO blocks (property_id, name, total_floors, rooms_per_floor, total_rooms)
  VALUES (prop_id, 'D', 9, 42, 358)
  ON CONFLICT DO NOTHING;

  -- Insert Block E: 350 rooms (42 per floor for 8 floors + 14 on 9th floor)
  INSERT INTO blocks (property_id, name, total_floors, rooms_per_floor, total_rooms)
  VALUES (prop_id, 'E', 9, 42, 350)
  ON CONFLICT DO NOTHING;

  -- Insert Block F: 234 rooms (28 per floor for 8 floors + 10 on 9th floor)
  INSERT INTO blocks (property_id, name, total_floors, rooms_per_floor, total_rooms)
  VALUES (prop_id, 'F', 9, 28, 234)
  ON CONFLICT DO NOTHING;

  -- Insert Block G: 234 rooms (28 per floor for 8 floors + 10 on 9th floor)
  INSERT INTO blocks (property_id, name, total_floors, rooms_per_floor, total_rooms)
  VALUES (prop_id, 'G', 9, 28, 234)
  ON CONFLICT DO NOTHING;

  -- Insert Block H: 74 rooms (9 per floor for 8 floors + 2 on 9th floor)
  INSERT INTO blocks (property_id, name, total_floors, rooms_per_floor, total_rooms)
  VALUES (prop_id, 'H', 9, 9, 74)
  ON CONFLICT DO NOTHING;
END $$;
