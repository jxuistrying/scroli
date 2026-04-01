import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Database } from '../types/database';

type Tables = Database['public']['Tables'];

// Generic fetcher for a given table
const fetchAll = async <T extends keyof Tables>(table: T) => {
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return data;
};

// --- Profiles ---
export const useProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// --- Goals ---
export const useGoals = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['goals', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newGoal: Tables['goals']['Insert']) => {
      const { data, error } = await supabase
        .from('goals')
        .insert(newGoal)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals', variables.user_id] });
    },
  });
};

// --- Wallet ---
export const useWallet = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['wallet', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// --- Daily Records ---
export const useDailyRecords = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['daily_records', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('daily_records')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// --- Charities ---
export const useCharities = () => {
  return useQuery({
    queryKey: ['charities'],
    queryFn: () => fetchAll('charities'),
  });
};
