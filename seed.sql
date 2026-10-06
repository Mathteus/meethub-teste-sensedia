DELETE FROM rooms;
DELETE FROM accounts;

INSERT INTO accounts (id, username, email, password_hash, role) VALUES
  ('a0000000-0000-7000-8000-000000000001', 'admin', 'admin@meethub.com', '$2b$10$C/AaUMyGkRrgpFgFBgxPqOSbzF3D1GFdG0/v/4V910UONTJVGiJOm', 'ADMIN'),
  ('a0000000-0000-7000-8000-000000000002', 'maria', 'maria@meethub.com', '$2b$10$10qK/JMiDvPok220G7ymeOXc1SHfMA3EmYMdBnt6NszxjGrzWJ/ES', 'USER'),
  ('a0000000-0000-7000-8000-000000000003', 'joao', 'joao@meethub.com', '$2b$10$10qK/JMiDvPok220G7ymeOXc1SHfMA3EmYMdBnt6NszxjGrzWJ/ES', 'USER')
ON CONFLICT (id) DO NOTHING;

INSERT INTO rooms (id, title, room_name, description, participants, start_at, duration_minutes, max_duration_minutes, resources, created_by) VALUES
  ('b0000000-0000-7000-8000-000000000001', 'Reunião de planejamento', 'Sala Alfa', 'Planejamento semanal da equipe de produto', ARRAY['maria', 'joao'], '2026-10-06T14:00:00Z', 60, 240, ARRAY['Wifi', 'Projetor', 'Câmera'], 'a0000000-0000-7000-8000-000000000001'),
  ('b0000000-0000-7000-8000-000000000002', 'Daily do backend', 'Sala Beta', 'Sincronização diária do time de backend', ARRAY['joao'], '2026-10-06T09:00:00Z', 15, 120, ARRAY['Wifi', 'Smart Tv'], 'a0000000-0000-7000-8000-000000000002'),
  ('b0000000-0000-7000-8000-000000000003', 'Apresentação para cliente', 'Sala Gamma', 'Demo do produto para a diretoria', ARRAY['maria', 'joao', 'admin'], '2026-10-07T18:00:00Z', 120, 480, ARRAY['Wifi', 'Projetor', 'Mesa de Som', 'Ar-Condicionado'], 'a0000000-0000-7000-8000-000000000001'),
  ('b0000000-0000-7000-8000-000000000004', 'Brainstorm de features', 'Sala Delta', 'Ideação de novas funcionalidades', ARRAY['maria'], '2026-10-08T13:30:00Z', 90, 240, ARRAY['Wifi', 'Lousa Branca', 'Frigobar'], 'a0000000-0000-7000-8000-000000000003'),
  ('b0000000-0000-7000-8000-000000000005', 'Entrevista técnica', 'Sala Epsilon', 'Entrevista para vaga de desenvolvedor', ARRAY['admin', 'joao'], '2026-10-09T16:00:00Z', 45, 60, ARRAY['Wifi', 'Câmera', 'Lousa Interativa'], 'a0000000-0000-7000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;
