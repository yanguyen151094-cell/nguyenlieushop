import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useSiteSetting<T extends Record<string, unknown>>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();
      if (error) throw error;
      const raw = (data?.value ?? null) as Partial<T> | null;
      setValue(raw ? { ...fallback, ...raw } : fallback);
    } catch {
      setValue(fallback);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { value, loading, refresh: load, setValue };
}

export async function saveSiteSetting(key: string, value: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('site_settings').upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: 'key' },
  );
  if (error) throw error;
}