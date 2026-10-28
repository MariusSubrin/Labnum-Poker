import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Group, GroupMember } from '../types';
import { generateReadableInviteCode, sha256 } from '../utils/crypto';

export interface CreateGroupResponse {
  groupId?: string;
  error?: string;
}

export interface JoinGroupResponse {
  groupId?: string;
  error?: string;
}

export interface InviteCodeResult {
  code?: string;
  expiresAt?: string;
  maxUses?: number;
  error?: string;
}

/**
 * Création d'un nouveau groupe avec le créateur comme propriétaire via RPC sécurisée
 */
export async function createGroup(
  name: string,
  ownerNickname: string,
  timezone: string = 'Europe/Paris'
): Promise<CreateGroupResponse> {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase n’est pas configuré.' };
  }

  const { data, error } = await supabase.rpc('create_group_with_owner', {
    p_name: name.trim(),
    p_owner_nickname: ownerNickname.trim(),
    p_timezone: timezone
  });

  if (error) {
    return { error: error.message };
  }

  return { groupId: data as string };
}

/**
 * Rejoindre un groupe avec un code d'invitation via la RPC sécurisée (avec FOR UPDATE)
 */
export async function joinGroupWithCode(
  inviteCode: string,
  nickname: string
): Promise<JoinGroupResponse> {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase n’est pas configuré.' };
  }

  const { data, error } = await supabase.rpc('join_group_with_code', {
    p_invite_code: inviteCode.trim().toUpperCase(),
    p_nickname: nickname.trim()
  });

  if (error) {
    return { error: error.message };
  }

  return { groupId: data as string };
}

/**
 * Récupère le groupe et l'adhésion d'un utilisateur
 */
export async function getUserMembership(
  userId: string
): Promise<{ group: Group | null; membership: GroupMember | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { group: null, membership: null };
  }

  const { data: memberData, error: memberError } = await supabase
    .from('group_members')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (memberError || !memberData) {
    return { group: null, membership: null, error: memberError?.message };
  }

  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', memberData.group_id)
    .single();

  if (groupError || !groupData) {
    return { group: null, membership: null, error: groupError?.message };
  }

  return {
    group: {
      id: groupData.id,
      name: groupData.name,
      ownerUserId: groupData.owner_user_id,
      timezone: groupData.timezone,
      createdAt: groupData.created_at
    },
    membership: {
      groupId: memberData.group_id,
      userId: memberData.user_id,
      nickname: memberData.nickname,
      role: memberData.role as 'owner' | 'member',
      status: memberData.status as 'active' | 'archived',
      joinedAt: memberData.joined_at,
      archivedAt: memberData.archived_at
    }
  };
}

/**
 * Récupère la liste de tous les membres d'un groupe
 */
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((m) => ({
    groupId: m.group_id,
    userId: m.user_id,
    nickname: m.nickname,
    role: m.role as 'owner' | 'member',
    status: m.status as 'active' | 'archived',
    joinedAt: m.joined_at,
    archivedAt: m.archived_at
  }));
}

/**
 * Génère un code d'invitation sécurisé pour le groupe (réservé au propriétaire)
 * Stocke le hash SHA-256 en base et retourne le code lisible à transmettre.
 */
export async function createInviteCode(
  groupId: string,
  userId: string,
  maxUses: number = 10,
  expiresInDays: number = 7
): Promise<InviteCodeResult> {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase n’est pas configuré.' };
  }

  const readableCode = generateReadableInviteCode();
  const tokenHash = await sha256(readableCode);

  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + expiresInDays);
  const expiresAt = expiresDate.toISOString();

  const { error } = await supabase.from('group_invitations').insert({
    group_id: groupId,
    token_hash: tokenHash,
    created_by: userId,
    expires_at: expiresAt,
    max_uses: maxUses,
    uses_count: 0
  });

  if (error) {
    return { error: error.message };
  }

  return {
    code: readableCode,
    expiresAt,
    maxUses
  };
}

/**
 * Archive un membre du groupe (réservé au propriétaire) via RPC sécurisée
 */
export async function archiveMember(
  groupId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase n’est pas configuré.' };
  }

  const { error } = await supabase.rpc('archive_group_member', {
    p_group_id: groupId,
    p_target_user_id: targetUserId
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
