import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@focuspilot/types";

// Supabase client type
export type SupabaseClientType = SupabaseClient<Database>;

// Client factory function
export function createSupabaseClient(
  supabaseUrl: string,
  supabaseKey: string,
  options?: {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
    };
  }
): SupabaseClientType {
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: options?.auth?.autoRefreshToken ?? true,
      persistSession: options?.auth?.persistSession ?? true,
    },
  });
}

// Server-side client (with service role key)
export function createSupabaseServerClient(
  supabaseUrl: string,
  serviceRoleKey: string
): SupabaseClientType {
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Default client instance (will be configured in apps)
let defaultClient: SupabaseClientType | null = null;

export function setDefaultClient(client: SupabaseClientType): void {
  defaultClient = client;
}

export function getDefaultClient(): SupabaseClientType {
  if (!defaultClient) {
    throw new Error(
      "Default Supabase client not initialized. Call setDefaultClient() first."
    );
  }
  return defaultClient;
}

// Auth utilities
export async function getCurrentUser(client?: SupabaseClientType) {
  const supabase = client || getDefaultClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Failed to get current user: ${error.message}`);
  }

  return user;
}

export async function signOut(client?: SupabaseClientType) {
  const supabase = client || getDefaultClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Failed to sign out: ${error.message}`);
  }
}
