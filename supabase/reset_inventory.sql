-- Popular Pizza inventory reset
-- Replaces ALL test items with the real inventory list, clears old test
-- count history, and sets the owner's display name.
-- Run in the Supabase SQL editor. Destructive: wipes items + count_logs.

-- 1. Owner display name (edit the name if you prefer something else)
update profiles set full_name = 'Vedant Dave' where role = 'owner';

-- 2. Wipe test data (count_logs first: it references items)
delete from count_logs;
delete from items;

-- 3. Real inventory. Starting quantities are set a bit above threshold;
--    run a Daily Count to record actual stock.
do $$
declare
  owner_user_id uuid;
begin
  select id into owner_user_id from profiles where role = 'owner' limit 1;

  insert into items (user_id, name, unit, current_quantity, reorder_threshold, category) values
    (owner_user_id, 'Cheese', '10 KG Box', 5, 3, 'Dairy'),
    (owner_user_id, 'Tomato Sauce', 'cans', 7, 5, 'Dry Goods'),
    (owner_user_id, 'Flour', 'bags', 5, 3, 'Dry Goods'),
    (owner_user_id, 'Pepperoni', 'lbs', 6, 4, 'Meat'),
    (owner_user_id, 'Mozzarella', 'lbs', 5, 3, 'Dairy'),
    (owner_user_id, 'Ham', 'lbs', 4, 2, 'Meat'),
    (owner_user_id, 'Bacon', 'lbs', 4, 2, 'Meat'),
    (owner_user_id, 'Ground Beef', 'lbs', 5, 3, 'Meat'),
    (owner_user_id, 'Sausage', 'lbs', 4, 2, 'Meat'),
    (owner_user_id, 'Pineapple', 'cans', 4, 2, 'Produce'),
    (owner_user_id, 'Green Olives', 'cans', 3, 1, 'Produce'),
    (owner_user_id, 'Jalapeno Peppers', 'jars', 3, 1, 'Produce'),
    (owner_user_id, 'Hot Peppers', 'jars', 3, 1, 'Produce'),
    (owner_user_id, 'Roasted Red Peppers', 'jars', 3, 1, 'Produce'),
    (owner_user_id, 'Garlic Bread', 'boxes', 4, 2, 'Dry Goods'),
    (owner_user_id, 'Potato Wedges', 'bags', 4, 2, 'Dry Goods'),
    (owner_user_id, 'Veg Oil', 'jugs', 4, 2, 'Dry Goods'),
    (owner_user_id, 'Napkins', 'packs', 4, 2, 'Cleaning'),
    (owner_user_id, 'Dough Balls', 'units', 14, 10, 'Produce');
end $$;
