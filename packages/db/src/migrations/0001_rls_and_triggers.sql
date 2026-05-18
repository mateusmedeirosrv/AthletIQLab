-- Migration: RLS policies, triggers, and pgcrypto setup
-- Run AFTER the initial schema migration (0000_*.sql)

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Auto-create public.users on Supabase auth signup ─────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, oauth_provider, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'personal'),
    COALESCE((NEW.raw_app_meta_data->>'provider')::oauth_provider, 'email'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_auth_user();

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at
  BEFORE UPDATE ON public.personals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at
  BEFORE UPDATE ON public.anamneses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── RLS Policies ──────────────────────────────────────────────────────────────

-- users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- personals
ALTER TABLE public.personals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personals_insert_own" ON public.personals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "personals_select_own" ON public.personals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "personals_update_own" ON public.personals
  FOR UPDATE USING (auth.uid() = user_id);

-- Students can view their personal's profile (for the mobile app)
CREATE POLICY "personals_select_by_student" ON public.personals
  FOR SELECT USING (
    user_id IN (
      SELECT personal_id FROM public.students WHERE user_id = auth.uid()
    )
  );

-- personal_invites
ALTER TABLE public.personal_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites_all_own" ON public.personal_invites
  FOR ALL
  USING (auth.uid() = personal_id)
  WITH CHECK (auth.uid() = personal_id);

-- students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_all_by_personal" ON public.students
  FOR ALL
  USING (auth.uid() = personal_id)
  WITH CHECK (auth.uid() = personal_id);

CREATE POLICY "students_select_own" ON public.students
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "students_update_own" ON public.students
  FOR UPDATE USING (auth.uid() = user_id);

-- exercises
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Curated exercises visible to all authenticated users
CREATE POLICY "exercises_select_curated" ON public.exercises
  FOR SELECT USING (source = 'curated' OR is_public = true);

-- Personals read/write their own custom exercises
CREATE POLICY "exercises_select_own" ON public.exercises
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "exercises_insert_own" ON public.exercises
  FOR INSERT WITH CHECK (auth.uid() = owner_id AND source = 'personal');

CREATE POLICY "exercises_update_own" ON public.exercises
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "exercises_delete_own" ON public.exercises
  FOR DELETE USING (auth.uid() = owner_id);

-- workouts
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workouts_all_by_personal" ON public.workouts
  FOR ALL
  USING (auth.uid() = personal_id)
  WITH CHECK (auth.uid() = personal_id);

CREATE POLICY "workouts_select_by_student" ON public.workouts
  FOR SELECT USING (auth.uid() = student_id);

-- workout_exercises
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_exercises_all_by_personal" ON public.workout_exercises
  FOR ALL
  USING (
    workout_id IN (
      SELECT id FROM public.workouts WHERE personal_id = auth.uid()
    )
  )
  WITH CHECK (
    workout_id IN (
      SELECT id FROM public.workouts WHERE personal_id = auth.uid()
    )
  );

CREATE POLICY "workout_exercises_select_by_student" ON public.workout_exercises
  FOR SELECT USING (
    workout_id IN (
      SELECT id FROM public.workouts WHERE student_id = auth.uid()
    )
  );

-- workout_sessions
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_all_by_personal" ON public.workout_sessions
  FOR ALL
  USING (auth.uid() = personal_id)
  WITH CHECK (auth.uid() = personal_id);

CREATE POLICY "sessions_all_by_student" ON public.workout_sessions
  FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- session_exercise_logs
ALTER TABLE public.session_exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_logs_all_by_participant" ON public.session_exercise_logs
  FOR ALL
  USING (
    session_id IN (
      SELECT id FROM public.workout_sessions
      WHERE personal_id = auth.uid() OR student_id = auth.uid()
    )
  );

-- anamneses (LGPD — sensitive data)
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anamneses_select_personal" ON public.anamneses
  FOR SELECT USING (
    student_id IN (
      SELECT user_id FROM public.students WHERE personal_id = auth.uid()
    )
  );

CREATE POLICY "anamneses_select_student" ON public.anamneses
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "anamneses_insert_personal" ON public.anamneses
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT user_id FROM public.students WHERE personal_id = auth.uid()
    )
  );

CREATE POLICY "anamneses_update_personal" ON public.anamneses
  FOR UPDATE USING (
    student_id IN (
      SELECT user_id FROM public.students WHERE personal_id = auth.uid()
    )
  );

-- progress_entries
ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progress_select_personal" ON public.progress_entries
  FOR SELECT USING (
    student_id IN (
      SELECT user_id FROM public.students WHERE personal_id = auth.uid()
    )
  );

CREATE POLICY "progress_select_student" ON public.progress_entries
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "progress_insert_personal" ON public.progress_entries
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT user_id FROM public.students WHERE personal_id = auth.uid()
    )
  );

-- heart_rate_samples
ALTER TABLE public.heart_rate_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_samples_by_session_participant" ON public.heart_rate_samples
  FOR ALL
  USING (
    session_id IN (
      SELECT id FROM public.workout_sessions
      WHERE personal_id = auth.uid() OR student_id = auth.uid()
    )
  );

-- conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select_participant" ON public.conversations
  FOR SELECT USING (auth.uid() = personal_id OR auth.uid() = student_id);

CREATE POLICY "conversations_insert_personal" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = personal_id);

-- chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_select_participant" ON public.chat_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE personal_id = auth.uid() OR student_id = auth.uid()
    )
  );

CREATE POLICY "chat_messages_insert_participant" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND conversation_id IN (
      SELECT id FROM public.conversations
      WHERE personal_id = auth.uid() OR student_id = auth.uid()
    )
  );

-- subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = personal_id);

-- ai_usage_log (personal read-only; service role writes)
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_usage_select_own" ON public.ai_usage_log
  FOR SELECT USING (auth.uid() = personal_id);

-- audit_log (service role only — no direct user access)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- notification_tokens
ALTER TABLE public.notification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_tokens_all_own" ON public.notification_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
