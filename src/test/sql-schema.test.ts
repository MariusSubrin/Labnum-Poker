import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Supabase SQL Schema & RLS Policy Integrity', () => {
  const migrationPath = path.resolve(__dirname, '../../supabase/migrations/20261028000001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  it('inclut toutes les tables requises', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.profiles');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.groups');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.group_members');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.daily_results');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.group_invitations');
  });

  it('active Row Level Security sur l’ensemble des tables', () => {
    expect(sql).toContain('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE public.daily_results ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;');
  });

  it('applique la contrainte mathématique exacte pour les jetons', () => {
    // total = blue*1 + red*5 + black*10 + green*25 + white*100
    expect(sql).toMatch(/blue_count\s*\*\s*1/);
    expect(sql).toMatch(/red_count\s*\*\s*5/);
    expect(sql).toMatch(/black_count\s*\*\s*10/);
    expect(sql).toMatch(/green_count\s*\*\s*25/);
    expect(sql).toMatch(/white_count\s*\*\s*100/);
  });

  it('impose l’unicité d’un seul relevé par joueur/groupe/jour', () => {
    expect(sql).toContain('CONSTRAINT uq_result_per_day UNIQUE (group_id, user_id, result_date)');
  });

  it('interdit les valeurs de jetons en mode total direct', () => {
    expect(sql).toContain('chk_total_mode_counts_null');
    expect(sql).toContain('blue_count IS NULL');
    expect(sql).toContain('red_count IS NULL');
    expect(sql).toContain('black_count IS NULL');
    expect(sql).toContain('green_count IS NULL');
    expect(sql).toContain('white_count IS NULL');
  });

  it('fournit les fonctions RPC sécurisées avec SECURITY DEFINER et search_path fixé', () => {
    expect(sql).toContain('FUNCTION public.is_active_group_member');
    expect(sql).toContain('FUNCTION public.is_group_owner');
    expect(sql).toContain('FUNCTION public.join_group_with_code');
    expect(sql).toContain('FUNCTION public.create_group_with_owner');
    expect(sql).toContain('FUNCTION public.archive_group_member');
    expect(sql).toContain('SET search_path = public');
  });

  it('protège la fonction join_group_with_code contre la concurrence avec FOR UPDATE', () => {
    expect(sql).toContain('FOR UPDATE');
  });
});
