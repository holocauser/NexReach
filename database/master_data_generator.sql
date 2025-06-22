-- Master Data Generation Script (v2) - More robust and provides progress.
-- This single script creates test users AND generates a large volume of data.
-- WARNING: This can take a few minutes to run. Do NOT run this in a production environment.
-- Use the 'master_cleanup.sql' script to remove all generated data.

-- Step 1: Ensure the pgcrypto extension is available for password hashing.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Step 2: Create users and generate data within a single transaction block.
DO $$
DECLARE
    -- ----- CONFIGURATION -----
    num_dummy_users_to_create INT := 9;
    num_cards_per_user INT := 1000;
    num_files_per_card INT := 2;
    num_voice_notes_per_card INT := 1;
    num_referrals_to_create INT := 10000;
    num_events_to_create INT := 200;

    -- ----- DATA SAMPLES -----
    first_names TEXT[] := ARRAY['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Skyler', 'Jamie', 'Riley', 'Peyton', 'Avery'];
    last_names TEXT[] := ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    companies TEXT[] := ARRAY['Innovate Inc.', 'Quantum Solutions', 'Nexus Corp.', 'Starlight Tech', 'Apex Industries'];
    titles TEXT[] := ARRAY['Developer', 'Manager', 'Analyst', 'CEO', 'Designer', 'Engineer'];
    cities TEXT[] := ARRAY['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
    states TEXT[] := ARRAY['NY', 'CA', 'IL', 'TX', 'AZ'];
    case_types TEXT[] := ARRAY['Personal Injury', 'Corporate Law', 'Real Estate', 'Immigration', 'Family Law'];
    event_titles TEXT[] := ARRAY['Annual Tech Summit', 'Marketing Masterclass', 'Future of AI Panel', 'Startup Pitch Night'];
    file_names TEXT[] := ARRAY['Contract.pdf', 'Proposal.docx', 'Presentation.pptx', 'Invoice.xls', 'Notes.txt'];
    mime_types TEXT[] := ARRAY['application/pdf', 'application/msword', 'application/vnd.ms-powerpoint', 'application/vnd.ms-excel', 'text/plain'];
    voice_note_names TEXT[] := ARRAY['Meeting Follow-up', 'Action Items', 'Initial Thoughts', 'Contact Details'];

    -- ----- SCRIPT VARIABLES -----
    i INT;
    j INT;
    new_user_id UUID;
    user_ids UUID[];
    all_card_ids UUID[];
    new_card_id UUID;
    random_user_id UUID;
    random_card_id_1 UUID;
    random_card_id_2 UUID;
    random_index INT;

BEGIN
    -- Part A: Create Dummy Users
    RAISE NOTICE 'Creating % dummy users...', num_dummy_users_to_create;
    FOR i IN 1..num_dummy_users_to_create LOOP
        INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
        VALUES (
            gen_random_uuid(), 'authenticated', 'authenticated', 'testuser' || i || '@scancard-test.com',
            crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()
        ) ON CONFLICT (id) DO NOTHING;
    END LOOP;
    RAISE NOTICE 'Finished creating users.';

    -- Part B: Generate Cards, Files, and Voice Notes
    RAISE NOTICE 'Fetching all user IDs for data generation...';
    SELECT ARRAY(SELECT id FROM auth.users) INTO user_ids;
    
    RAISE NOTICE 'Generating cards and their related files/notes...';
    FOREACH random_user_id IN ARRAY user_ids
    LOOP
        RAISE NOTICE 'Generating data for user %', random_user_id;
        FOR i IN 1..num_cards_per_user LOOP
            -- Insert a card and get its new ID back
            INSERT INTO public.cards (user_id, name, title, company, email, phone, city, state)
            VALUES (
                random_user_id,
                first_names[1 + floor(random() * array_length(first_names, 1))] || ' ' || last_names[1 + floor(random() * array_length(last_names, 1))],
                titles[1 + floor(random() * array_length(titles, 1))],
                companies[1 + floor(random() * array_length(companies, 1))],
                'test.email' || i || '@example.com', '555-010' || i,
                cities[1 + floor(random() * array_length(cities, 1))],
                states[1 + floor(random() * array_length(states, 1))]
            ) RETURNING id INTO new_card_id;

            -- Create files for the new card
            FOR j IN 1..num_files_per_card LOOP
                INSERT INTO public.files (card_id, user_id, name, type, url, size, mime_type)
                VALUES (new_card_id, random_user_id, file_names[1 + floor(random() * array_length(file_names, 1))], 'document', 'https://example.com/file.bin', 10000, mime_types[1 + floor(random() * array_length(mime_types, 1))]);
            END LOOP;
            
            -- Create voice notes for the new card
            FOR j IN 1..num_voice_notes_per_card LOOP
                INSERT INTO public.voice_notes (card_id, user_id, name, url, duration, size)
                VALUES (new_card_id, random_user_id, voice_note_names[1 + floor(random() * array_length(voice_note_names, 1))], 'https://example.com/note.mp3', 60, 100000);
            END LOOP;
        END LOOP;
    END LOOP;

    -- Part C: Generate Referrals and Events
    RAISE NOTICE 'Generating referrals...';
    SELECT ARRAY(SELECT id FROM public.cards) INTO all_card_ids;
    IF array_length(all_card_ids, 1) < 2 THEN
        RAISE NOTICE 'Not enough cards to create referrals. Skipping.';
    ELSE
        FOR i IN 1..num_referrals_to_create LOOP
            random_card_id_1 := all_card_ids[1 + floor(random() * array_length(all_card_ids, 1))];
            random_card_id_2 := all_card_ids[1 + floor(random() * array_length(all_card_ids, 1))];
            SELECT user_id INTO random_user_id FROM public.cards WHERE id = random_card_id_1;
            INSERT INTO public.referrals (user_id, referrer_id, recipient_id, date, case_type, outcome, value)
            VALUES (random_user_id, random_card_id_1, random_card_id_2, NOW(), 'Corporate Law', 'pending', 100);
        END LOOP;
    END IF;

    RAISE NOTICE 'Generating events...';
    FOR i IN 1..num_events_to_create LOOP
        random_user_id := user_ids[1 + floor(random() * array_length(user_ids, 1))];
        INSERT INTO public.events (user_id, title, description, location, start_time, end_time)
        VALUES (random_user_id, 'Generated Event', 'Test event description', 'Online', NOW(), NOW());
    END LOOP;

    RAISE NOTICE 'Load test data generation complete!';
END $$; 