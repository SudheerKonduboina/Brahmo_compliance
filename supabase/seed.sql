-- ============================================================================
-- BRAHMO Compliance Engine - Seed Data
-- ============================================================================
-- Complete demo dataset for testing and demonstration

-- ============================================================================
-- CLIENTS
-- ============================================================================
INSERT INTO clients (id, name, created_at) VALUES
  ('c1a11111-1111-1111-1111-111111111111'::uuid, 'Acme Corporation', NOW()),
  ('c2b22222-2222-2222-2222-222222222222'::uuid, 'Global Industries', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MATTERS
-- ============================================================================
INSERT INTO matters (id, client_id, matter_name, practice_area, court, status, created_at) VALUES
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'c1a11111-1111-1111-1111-111111111111'::uuid, 
   'Acme v. Smith', 'Litigation', 'District Court - New York', 'active', NOW()),
  
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'c1a11111-1111-1111-1111-111111111111'::uuid, 
   'Acme Contract Review', 'Corporate', NULL, 'active', NOW()),
  
  ('e3333333-3333-3333-3333-333333333333'::uuid, 'c2b22222-2222-2222-2222-222222222222'::uuid, 
   'Global IP Matter', 'Intellectual Property', 'Patent Court', 'active', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- USERS
-- ============================================================================
INSERT INTO users (id, name, email, role, sra_number, created_at) VALUES
  ('686b9b22-572f-426d-9a61-9877df2b275e'::uuid, 'Priya Singh', 'priya@brahmo.ai', 'associate', 'SRA-2023-001', NOW()),
  ('28ecf025-7f2d-48e5-b28b-09e9676d110d'::uuid, 'Rahul Patel', 'rahul@brahmo.ai', 'associate', 'SRA-2023-002', NOW()),
  ('d734601d-9dac-4c80-a77b-1b5ce97ee985'::uuid, 'Sarah Chen', 'partner@brahmo.ai', 'partner', 'SRA-2020-001', NOW()),
  ('5b83f9af-405d-4d8e-9179-080b9adb9feb'::uuid, 'Sonia Rodriguez', 'sonia@brahmo.ai', 'associate', 'SRA-2023-003', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MATTER PERMISSIONS (Ethical Walls)
-- ============================================================================
-- Priya: Matter 1 and 2
INSERT INTO matter_permissions (id, user_id, matter_id, permission_level, granted_at, granted_by) VALUES
  ('f1111111-1111-1111-1111-111111111111'::uuid, '686b9b22-572f-426d-9a61-9877df2b275e'::uuid, 'e1111111-1111-1111-1111-111111111111'::uuid, 'read', NOW(), 'd734601d-9dac-4c80-a77b-1b5ce97ee985'::uuid),
  ('f2222222-2222-2222-2222-222222222222'::uuid, '686b9b22-572f-426d-9a61-9877df2b275e'::uuid, 'e2222222-2222-2222-2222-222222222222'::uuid, 'read_write', NOW(), 'd734601d-9dac-4c80-a77b-1b5ce97ee985'::uuid),
  
  -- Rahul: Matters 1, 2, and 3
  ('f3333333-1111-1111-1111-111111111111'::uuid, '28ecf025-7f2d-48e5-b28b-09e9676d110d'::uuid, 'e1111111-1111-1111-1111-111111111111'::uuid, 'read', NOW(), 'd734601d-9dac-4c80-a77b-1b5ce97ee985'::uuid),
  ('f3333333-2222-2222-2222-222222222222'::uuid, '28ecf025-7f2d-48e5-b28b-09e9676d110d'::uuid, 'e2222222-2222-2222-2222-222222222222'::uuid, 'read', NOW(), 'd734601d-9dac-4c80-a77b-1b5ce97ee985'::uuid),
  ('f3333333-3333-3333-3333-333333333333'::uuid, '28ecf025-7f2d-48e5-b28b-09e9676d110d'::uuid, 'e3333333-3333-3333-3333-333333333333'::uuid, 'read', NOW(), 'd734601d-9dac-4c80-a77b-1b5ce97ee985'::uuid),
  
  -- Sonia: Matter 1 only
  ('f4444444-4444-4444-4444-444444444444'::uuid, '5b83f9af-405d-4d8e-9179-080b9adb9feb'::uuid, 'e1111111-1111-1111-1111-111111111111'::uuid, 'read', NOW(), 'd734601d-9dac-4c80-a77b-1b5ce97ee985'::uuid)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- AI_SESSIONS (Audit Trail)
-- ============================================================================
INSERT INTO ai_sessions 
  (id, user_id, matter_id, session_start, session_end, query_type, output_token_count, 
   output_hash, review_status, reviewer_id, review_timestamp, review_decision, review_notes, created_at) 
VALUES
  -- Priya sessions (Matter 1 & 2)
  ('51111111-1111-1111-1111-111111111111'::uuid, '686b9b22-572f-426d-9a61-9877df2b275e'::uuid, 'e1111111-1111-1111-1111-111111111111'::uuid,
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '15 minutes', 'document_review', 2150,
   'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', 'reviewed', 
   'd734601d-9dac-4c80-a77b-1b5ce97ee985'::uuid, NOW() - INTERVAL '2 days', 'approved', 'Standard compliance review passed', NOW() - INTERVAL '3 days'),
  
  ('52222222-2222-2222-2222-222222222222'::uuid, '686b9b22-572f-426d-9a61-9877df2b275e'::uuid, 'e2222222-2222-2222-2222-222222222222'::uuid,
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '22 minutes', 'contract_analysis', 3100,
   '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'reviewed',
   'd734601d-9dac-4c80-a77b-1b5ce97ee985'::uuid, NOW() - INTERVAL '1 day', 'approved', 'Review complete', NOW() - INTERVAL '2 days'),
  
  ('53333333-3333-3333-3333-333333333333'::uuid, '686b9b22-572f-426d-9a61-9877df2b275e'::uuid, 'e1111111-1111-1111-1111-111111111111'::uuid,
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '18 minutes', 'legal_research', 1850,
   'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321', 'pending', NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 day'),
  
  ('54444444-4444-4444-4444-444444444444'::uuid, '686b9b22-572f-426d-9a61-9877df2b275e'::uuid, 'e2222222-2222-2222-2222-222222222222'::uuid,
   NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours' + INTERVAL '20 minutes', 'document_review', 2420,
   '9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba', 'pending', NULL, NULL, NULL, NULL, NOW() - INTERVAL '6 hours'),
  
  -- Rahul sessions (Matter 3)
  ('55555555-5555-5555-5555-555555555555'::uuid, '28ecf025-7f2d-48e5-b28b-09e9676d110d'::uuid, 'e3333333-3333-3333-3333-333333333333'::uuid,
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '25 minutes', 'patent_analysis', 2780,
   'aabbccdd11223344aabbccdd11223344aabbccdd11223344aabbccdd11223344', 'reviewed',
   'd734601d-9dac-4c80-a77b-1b5ce97ee985'::uuid, NOW() - INTERVAL '1 day', 'approved', 'Thorough patent review completed', NOW() - INTERVAL '2 days'),
  
  ('56666666-6666-6666-6666-666666666666'::uuid, '28ecf025-7f2d-48e5-b28b-09e9676d110d'::uuid, 'e3333333-3333-3333-3333-333333333333'::uuid,
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '30 minutes', 'document_review', 3200,
   '44332211ddccbbaa44332211ddccbbaa44332211ddccbbaa44332211ddccbbaa', 'pending', NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 day'),
  
  -- Partner session (Sarah)
  ('57777777-7777-7777-7777-777777777777'::uuid, 'd734601d-9dac-4c80-a77b-1b5ce97ee985'::uuid, 'e1111111-1111-1111-1111-111111111111'::uuid,
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '40 minutes', 'risk_assessment', 4100,
   'eeeeeeee88888888eeeeeeee88888888eeeeeeee88888888eeeeeeee88888888', 'reviewed',
   'd734601d-9dac-4c80-a77b-1b5ce97ee985'::uuid, NOW() - INTERVAL '3 days' + INTERVAL '1 hour', 'approved', 'Self-review: No concerns', NOW() - INTERVAL '3 days'),
  
  -- Sonia sessions (Matter 1)
  ('58888888-8888-8888-8888-888888888888'::uuid, '5b83f9af-405d-4d8e-9179-080b9adb9feb'::uuid, 'e1111111-1111-1111-1111-111111111111'::uuid,
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '16 minutes', 'document_review', 1950,
   '99999999ffffffff99999999ffffffff99999999ffffffff99999999ffffffff', 'reviewed',
   'd734601d-9dac-4c80-a77b-1b5ce97ee985'::uuid, NOW() - INTERVAL '1 day', 'approved', 'Standard approval', NOW() - INTERVAL '2 days'),
  
  ('59999999-9999-9999-9999-999999999999'::uuid, '5b83f9af-405d-4d8e-9179-080b9adb9feb'::uuid, 'e1111111-1111-1111-1111-111111111111'::uuid,
   NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours' + INTERVAL '24 minutes', 'legal_research', 2650,
   '00000000ffffffff00000000ffffffff00000000ffffffff00000000ffffffff', 'pending', NULL, NULL, NULL, NULL, NOW() - INTERVAL '12 hours')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- BLOCKED_ACCESS_LOG (Tamper-Proof, Append-Only)
-- ============================================================================
-- Blocked events with hash chaining for tamper detection

INSERT INTO blocked_access_log 
  (event_id, user_id, attempted_matter_id, reason, details, timestamp, previous_hash, current_hash, created_at) 
VALUES
  -- Event 1: Priya attempts Matter 3 (unauthorized)
  ('b1111111-1111-1111-1111-111111111111'::uuid, 
   '686b9b22-572f-426d-9a61-9877df2b275e'::uuid, 
   'e3333333-3333-3333-3333-333333333333'::uuid, 
   'no_permission', 
   'User attempted to access matter without explicit permission. Ethical wall enforced.',
   NOW() - INTERVAL '4 days',
   NULL,
   '1111111111111111111111111111111111111111111111111111111111111111',
   NOW() - INTERVAL '4 days'),
  
  -- Event 2: Rahul attempts Matter 1 (unauthorized)
  ('b2222222-2222-2222-2222-222222222222'::uuid,
   '28ecf025-7f2d-48e5-b28b-09e9676d110d'::uuid,
   'e1111111-1111-1111-1111-111111111111'::uuid,
   'no_permission',
   'User attempted access to different matter. Cross-matter access blocked.',
   NOW() - INTERVAL '3 days',
   '1111111111111111111111111111111111111111111111111111111111111111',
   '2222222222222222222222222222222222222222222222222222222222222222',
   NOW() - INTERVAL '3 days'),
  
  -- Event 3: Sonia attempts Matter 3 (unauthorized)
  ('b3333333-3333-3333-3333-333333333333'::uuid,
   '5b83f9af-405d-4d8e-9179-080b9adb9feb'::uuid,
   'e3333333-3333-3333-3333-333333333333'::uuid,
   'no_permission',
   'User attempted access to matter outside their ethical wall. Blocked at database level.',
   NOW() - INTERVAL '2 days',
   '2222222222222222222222222222222222222222222222222222222222222222',
   '3333333333333333333333333333333333333333333333333333333333333333',
   NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
