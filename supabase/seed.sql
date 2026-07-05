-- Pantri seed data
-- Replace the placeholder OWNER_USER_ID below with the actual auth.users.id
-- for the restaurant owner account (create the user first in Supabase Auth,
-- then copy their UUID from the Auth dashboard).

do $$
declare
  owner_user_id uuid := '1468a17d-df76-49a9-a79c-450c829bacbd';
begin
  insert into items (user_id, name, unit, current_quantity, reorder_threshold, category) values
    (owner_user_id, 'Flour', 'bags', 2, 1, 'Dry Goods'),
    (owner_user_id, 'Tomato Sauce', 'cans', 5, 2, 'Dry Goods'),
    (owner_user_id, 'Mozzarella', 'lbs', 3, 1, 'Meat'),
    (owner_user_id, 'Pepperoni', 'lbs', 2, 1, 'Meat'),
    (owner_user_id, 'Olive Oil', 'bottles', 1, 1, 'Dry Goods'),
    (owner_user_id, 'Napkins', 'packs', 4, 1, 'Cleaning'),
    (owner_user_id, 'Dough Balls', 'units', 8, 3, 'Produce');
end $$;
