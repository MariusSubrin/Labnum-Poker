-- ==============================================================================
-- Poker Ledger - Migration Initiale (Phase 2)
-- Architecture de données PostgreSQL, Triggers de validation, Sécurité RLS et RPCs
-- ==============================================================================

-- 0. Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. Table: profiles
-- Associée 1:1 à auth.users de Supabase
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL CHECK (char_length(trim(display_name)) >= 2 AND char_length(display_name) <= 50),
    avatar_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.profiles IS 'Profil utilisateur lié au compte Supabase Auth';

-- ==============================================================================
-- 2. Table: groups
-- Groupes privés de poker (ex: ~7 collègues)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2 AND char_length(name) <= 60),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.groups IS 'Groupes de poker indépendants';

-- ==============================================================================
-- 3. Table: group_members
-- Adhésions, rôles et historique des membres
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL CHECK (char_length(trim(nickname)) >= 2 AND char_length(nickname) <= 30),
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    CONSTRAINT uq_group_user UNIQUE (group_id, user_id),
    CONSTRAINT uq_group_nickname UNIQUE (group_id, nickname)
);

COMMENT ON TABLE public.group_members IS 'Adhésion au groupe avec unicité du pseudo par groupe';

CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_status ON public.group_members(group_id, status);

-- ==============================================================================
-- 4. Table: daily_results
-- Relevés de jetons quotidiens avec intégrité absolue des calculs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.daily_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    result_date DATE NOT NULL,
    entry_mode TEXT NOT NULL CHECK (entry_mode IN ('detailed', 'total')),
    total INTEGER NOT NULL CHECK (total >= 0 AND total <= 10000000),
    blue_count INTEGER CHECK (blue_count IS NULL OR (blue_count >= 0 AND blue_count <= 100000)),
    red_count INTEGER CHECK (red_count IS NULL OR (red_count >= 0 AND red_count <= 100000)),
    black_count INTEGER CHECK (black_count IS NULL OR (black_count >= 0 AND black_count <= 100000)),
    green_count INTEGER CHECK (green_count IS NULL OR (green_count >= 0 AND green_count <= 100000)),
    white_count INTEGER CHECK (white_count IS NULL OR (white_count >= 0 AND white_count <= 100000)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_result_per_day UNIQUE (group_id, user_id, result_date),
    -- Règle stricte : en mode total direct, aucun jeton par couleur n'est stocké
    CONSTRAINT chk_total_mode_counts_null CHECK (
        entry_mode != 'total' OR (
            blue_count IS NULL AND
            red_count IS NULL AND
            black_count IS NULL AND
            green_count IS NULL AND
            white_count IS NULL
        )
    ),
    -- Règle stricte : en mode détaillé, tous les jetons par couleur doivent être présents (>= 0)
    CONSTRAINT chk_detailed_mode_counts_not_null CHECK (
        entry_mode != 'detailed' OR (
            blue_count IS NOT NULL AND
            red_count IS NOT NULL AND
            black_count IS NOT NULL AND
            green_count IS NOT NULL AND
            white_count IS NOT NULL
        )
    ),
    -- Formule mathématique immuable : bleu*1 + rouge*5 + noir*10 + vert*25 + blanc*100
    CONSTRAINT chk_detailed_total_exact_match CHECK (
        entry_mode != 'detailed' OR (
            total = (
                blue_count * 1 +
                red_count * 5 +
                black_count * 10 +
                green_count * 25 +
                white_count * 100
            )
        )
    )
);

COMMENT ON TABLE public.daily_results IS 'Historique des relevés avec validation arithmétique forcée';

CREATE INDEX IF NOT EXISTS idx_daily_results_lookup ON public.daily_results(group_id, result_date);
CREATE INDEX IF NOT EXISTS idx_daily_results_user ON public.daily_results(user_id, result_date);

-- ==============================================================================
-- 5. Table: group_invitations
-- Codes d'invitation avec stockage sécurisé du hash uniquement (SHA-256)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.group_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    max_uses INTEGER NOT NULL CHECK (max_uses > 0),
    uses_count INTEGER NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.group_invitations IS 'Invitations sécurisées avec hashage de token';

CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON public.group_invitations(token_hash);

-- ==============================================================================
-- 6. Fonctions d'aide SECURITY DEFINER pour éviter toute récursion RLS
-- ==============================================================================

-- Vérifie si un utilisateur est membre ACTIF d'un groupe donné
CREATE OR REPLACE FUNCTION public.is_active_group_member(check_group_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.group_members
        WHERE group_id = check_group_id
          AND user_id = check_user_id
          AND status = 'active'
    );
$$;

-- Vérifie si un utilisateur est PROPRIÉTAIRE d'un groupe
CREATE OR REPLACE FUNCTION public.is_group_owner(check_group_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.groups
        WHERE id = check_group_id
          AND owner_user_id = check_user_id
    );
$$;

-- Trigger automatique pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_daily_results_updated_at ON public.daily_results;
CREATE TRIGGER trigger_daily_results_updated_at
    BEFORE UPDATE ON public.daily_results
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger de vérification d'adhésion active avant insertion d'un relevé
CREATE OR REPLACE FUNCTION public.check_result_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_active_group_member(NEW.group_id, NEW.user_id) THEN
        RAISE EXCEPTION 'L’utilisateur doit être un membre actif du groupe pour enregistrer un résultat.'
            USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_result_membership ON public.daily_results;
CREATE TRIGGER trigger_check_result_membership
    BEFORE INSERT OR UPDATE ON public.daily_results
    FOR EACH ROW
    EXECUTE FUNCTION public.check_result_membership();

-- ==============================================================================
-- 7. Procédures RPC sécurisées
-- ==============================================================================

-- Création atomique d'un groupe et enregistrement automatique du propriétaire
CREATE OR REPLACE FUNCTION public.create_group_with_owner(
    p_name TEXT,
    p_owner_nickname TEXT,
    p_timezone TEXT DEFAULT 'Europe/Paris'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_group_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Non authentifié' USING ERRCODE = '28000';
    END IF;

    -- Création du groupe
    INSERT INTO public.groups (name, owner_user_id, timezone)
    VALUES (trim(p_name), v_user_id, COALESCE(p_timezone, 'Europe/Paris'))
    RETURNING id INTO v_group_id;

    -- Ajout du propriétaire en tant que membre actif du groupe
    INSERT INTO public.group_members (group_id, user_id, nickname, role, status)
    VALUES (v_group_id, v_user_id, trim(p_owner_nickname), 'owner', 'active');

    RETURN v_group_id;
END;
$$;

-- Validation sécurisée et utilisation concurrente d'une invitation
CREATE OR REPLACE FUNCTION public.join_group_with_code(
    p_invite_code TEXT,
    p_nickname TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_hash TEXT;
    v_invite RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentification requise pour rejoindre un groupe.' USING ERRCODE = '28000';
    END IF;

    -- Calcul du hash SHA-256 du code transmis
    v_hash := encode(digest(trim(p_invite_code), 'sha256'), 'hex');

    -- Verrouillage de la ligne d'invitation contre les utilisations concurrentes (FOR UPDATE)
    SELECT * INTO v_invite
    FROM public.group_invitations
    WHERE token_hash = v_hash
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Code d’invitation invalide.' USING ERRCODE = '22023';
    END IF;

    IF v_invite.revoked_at IS NOT NULL THEN
        RAISE EXCEPTION 'Cette invitation a été révoquée.' USING ERRCODE = '22023';
    END IF;

    IF v_invite.expires_at < timezone('utc'::text, now()) THEN
        RAISE EXCEPTION 'Cette invitation a expiré.' USING ERRCODE = '22023';
    END IF;

    IF v_invite.uses_count >= v_invite.max_uses THEN
        RAISE EXCEPTION 'Le nombre maximum d’utilisations pour ce code a été atteint.' USING ERRCODE = '22023';
    END IF;

    -- Vérifier si l'utilisateur est déjà membre
    IF EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = v_invite.group_id AND user_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'Vous faites déjà partie de ce groupe.' USING ERRCODE = '23505';
    END IF;

    -- Incrémentation sécurisée
    UPDATE public.group_invitations
    SET uses_count = uses_count + 1
    WHERE id = v_invite.id;

    -- Enregistrement du nouveau membre
    INSERT INTO public.group_members (group_id, user_id, nickname, role, status)
    VALUES (v_invite.group_id, v_user_id, trim(p_nickname), 'member', 'active');

    RETURN v_invite.group_id;
END;
$$;

-- Archivage sécurisé d'un membre par le propriétaire
CREATE OR REPLACE FUNCTION public.archive_group_member(
    p_group_id UUID,
    p_target_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();

    IF NOT public.is_group_owner(p_group_id, v_caller_id) THEN
        RAISE EXCEPTION 'Action réservée au propriétaire du groupe.' USING ERRCODE = '42501';
    END IF;

    IF p_target_user_id = v_caller_id THEN
        RAISE EXCEPTION 'Le propriétaire ne peut pas s’archiver lui-même.' USING ERRCODE = '22023';
    END IF;

    UPDATE public.group_members
    SET status = 'archived',
        archived_at = timezone('utc'::text, now())
    WHERE group_id = p_group_id
      AND user_id = p_target_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Membre introuvable dans ce groupe.' USING ERRCODE = 'P0002';
    END IF;
END;
$$;

-- ==============================================================================
-- 8. Activation de Row Level Security (RLS) sur toutes les tables
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS: profiles
-- ------------------------------------------------------------------------------
-- Tout utilisateur authentifié peut lire les profils des membres de ses groupes
CREATE POLICY "profiles_select_own_or_group"
ON public.profiles FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.group_members gm_me
        JOIN public.group_members gm_other ON gm_me.group_id = gm_other.group_id
        WHERE gm_me.user_id = auth.uid()
          AND gm_me.status = 'active'
          AND gm_other.user_id = profiles.user_id
    )
);

CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- RLS: groups
-- ------------------------------------------------------------------------------
-- Seuls les membres (actifs ou archivés pour consulter l'historique) ou le propriétaire peuvent voir leur groupe
CREATE POLICY "groups_select_member_or_owner"
ON public.groups FOR SELECT
TO authenticated
USING (
    owner_user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = groups.id
          AND user_id = auth.uid()
    )
);

CREATE POLICY "groups_insert_authenticated"
ON public.groups FOR INSERT
TO authenticated
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "groups_update_owner_only"
ON public.groups FOR UPDATE
TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- RLS: group_members
-- ------------------------------------------------------------------------------
-- Un membre actif voit tous les membres (actifs et archivés) de son groupe
CREATE POLICY "members_select_if_active_in_group"
ON public.group_members FOR SELECT
TO authenticated
USING (
    public.is_active_group_member(group_id, auth.uid()) OR
    public.is_group_owner(group_id, auth.uid())
);

-- Seul le propriétaire peut modifier le rôle/statut directement (ou via RPC)
CREATE POLICY "members_update_owner_only"
ON public.group_members FOR UPDATE
TO authenticated
USING (public.is_group_owner(group_id, auth.uid()))
WITH CHECK (public.is_group_owner(group_id, auth.uid()));

-- ------------------------------------------------------------------------------
-- RLS: daily_results
-- ------------------------------------------------------------------------------
-- Un membre actif peut lire TOUS les relevés de son groupe (y compris membres archivés passés)
CREATE POLICY "results_select_active_members"
ON public.daily_results FOR SELECT
TO authenticated
USING (
    public.is_active_group_member(group_id, auth.uid())
);

-- Un membre actif ne peut insérer QUE ses propres relevés
CREATE POLICY "results_insert_own_only"
ON public.daily_results FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() AND
    public.is_active_group_member(group_id, auth.uid())
);

-- Un membre ne peut modifier QUE ses propres relevés
CREATE POLICY "results_update_own_only"
ON public.daily_results FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() AND
    public.is_active_group_member(group_id, auth.uid())
)
WITH CHECK (
    user_id = auth.uid() AND
    public.is_active_group_member(group_id, auth.uid())
);

-- Un membre ne peut supprimer QUE ses propres relevés
CREATE POLICY "results_delete_own_only"
ON public.daily_results FOR DELETE
TO authenticated
USING (
    user_id = auth.uid() AND
    public.is_active_group_member(group_id, auth.uid())
);

-- ------------------------------------------------------------------------------
-- RLS: group_invitations
-- ------------------------------------------------------------------------------
-- Seul le propriétaire du groupe peut voir, créer et révoquer les invitations
CREATE POLICY "invitations_owner_manage"
ON public.group_invitations FOR ALL
TO authenticated
USING (public.is_group_owner(group_id, auth.uid()))
WITH CHECK (public.is_group_owner(group_id, auth.uid()));
