DO $$
DECLARE
 v_admin uuid; v_guest uuid := gen_random_uuid(); v_ids uuid[] := ARRAY[gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
 v_original boolean; v_count integer; v_result jsonb; v_index integer;
BEGIN
 SELECT enabled INTO v_original FROM public.automatic_print_settings WHERE id=true;
 SELECT user_id INTO v_admin FROM public.user_roles WHERE role IN ('administrateur','super_administrateur') AND user_id IS NOT NULL LIMIT 1;
 IF v_admin IS NULL THEN RAISE EXCEPTION 'No administrator available for permission test'; END IF;
 IF has_function_privilege('anon','public.claim_automatic_print(uuid)','EXECUTE') OR has_function_privilege('authenticated','public.claim_automatic_print(uuid)','EXECUTE') THEN RAISE EXCEPTION 'Unsafe print dispatch grant'; END IF;
 BEGIN
   PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);
   EXECUTE 'SET LOCAL ROLE authenticated';
   UPDATE public.automatic_print_settings SET enabled=false WHERE id=true;
   GET DIAGNOSTICS v_count = ROW_COUNT;
   IF v_count <> 1 THEN RAISE EXCEPTION 'Administrator cannot disable global printing'; END IF;
   EXECUTE 'RESET ROLE';
   PERFORM set_config('request.jwt.claim.sub', v_guest::text, true);
   EXECUTE 'SET LOCAL ROLE authenticated';
   SELECT count(*) INTO v_count FROM public.automatic_print_settings;
   IF v_count <> 0 THEN RAISE EXCEPTION 'Non-admin can read settings'; END IF;
   UPDATE public.automatic_print_settings SET enabled=true WHERE id=true;
   GET DIAGNOSTICS v_count = ROW_COUNT;
   IF v_count <> 0 THEN RAISE EXCEPTION 'Non-admin can change settings'; END IF;
   EXECUTE 'RESET ROLE';
   FOR v_index IN 1..4 LOOP
     INSERT INTO public.orders(id, restaurant_id, stripe_session_id, payment_status, payment_method, status, order_type, subtotal, tax, delivery_fee, total, scheduled_for, client_name, items_summary)
     VALUES(v_ids[v_index], CASE WHEN v_index % 2 = 1 THEN '11111111-1111-1111-1111-111111111111'::uuid ELSE '22222222-2222-2222-2222-222222222222'::uuid END,
       'automatic-print-transaction-test-' || v_ids[v_index], 'paid', 'credit-card', 'confirmed', 'pickup', 0, 0, 0, 0, '2026-11-23 12:00:00', 'TEST TRANSACTION - NE PAS PREPARER', '[{"name":"TEST","quantity":1,"price":0}]'::jsonb);
   END LOOP;
   FOR v_index IN 1..2 LOOP
     IF public.claim_automatic_print(v_ids[v_index]) IS NOT NULL THEN RAISE EXCEPTION 'Disabled setting did not block restaurant %', v_index; END IF;
     SELECT count(*) INTO v_count FROM public.automatic_print_jobs WHERE order_id=v_ids[v_index] AND status='disabled';
     IF v_count <> 1 THEN RAISE EXCEPTION 'Disabled order not tracked'; END IF;
   END LOOP;
   PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);
   EXECUTE 'SET LOCAL ROLE authenticated';
   UPDATE public.automatic_print_settings SET enabled=true WHERE id=true;
   GET DIAGNOSTICS v_count = ROW_COUNT;
   IF v_count <> 1 THEN RAISE EXCEPTION 'Administrator cannot enable global printing'; END IF;
   EXECUTE 'RESET ROLE';
   FOR v_index IN 1..2 LOOP
     IF public.claim_automatic_print(v_ids[v_index]) IS NOT NULL THEN RAISE EXCEPTION 'Re-enabled printing caught up a disabled order'; END IF;
   END LOOP;
   FOR v_index IN 3..4 LOOP
     v_result := public.claim_automatic_print(v_ids[v_index]);
     IF v_result IS NULL OR (v_result->>'id')::uuid <> v_ids[v_index] THEN RAISE EXCEPTION 'Enabled setting did not allow restaurant %', v_index; END IF;
     IF public.claim_automatic_print(v_ids[v_index]) IS NOT NULL THEN RAISE EXCEPTION 'Duplicate automatic print claim'; END IF;
   END LOOP;
   RAISE EXCEPTION USING ERRCODE='ZP001', MESSAGE='Roll back successful test fixtures';
 EXCEPTION WHEN SQLSTATE 'ZP001' THEN NULL;
 END;
 IF (SELECT enabled FROM public.automatic_print_settings WHERE id=true) IS DISTINCT FROM v_original THEN RAISE EXCEPTION 'Test changed global setting'; END IF;
 IF EXISTS(SELECT 1 FROM public.orders WHERE id=ANY(v_ids)) OR EXISTS(SELECT 1 FROM public.automatic_print_jobs WHERE order_id=ANY(v_ids)) THEN RAISE EXCEPTION 'Test fixtures not cleaned'; END IF;
END $$;