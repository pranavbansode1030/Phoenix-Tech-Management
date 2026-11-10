/**
 * Phoenix Tech Solutions - Browser Supabase Client Wrapper
 *
 * For vanilla JS dashboard (index.html / app.js).
 * Supports initializing from window.SUPABASE_CONFIG or .env variables.
 */

(function (window) {
  'use strict';

  // Default configuration (can be overridden by setting window.PHOENIX_SUPABASE_CONFIG before this script)
  const config = window.PHOENIX_SUPABASE_CONFIG || {
    url: '',      // e.g., 'https://your-project.supabase.co'
    anonKey: ''   // e.g., 'eyJhbGciOiJIUzI1Ni...'
  };

  let client = null;

  function getClient() {
    if (!client) {
      if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
        if (config.url && config.anonKey) {
          client = window.supabase.createClient(config.url, config.anonKey);
        }
      }
    }
    return client;
  }

  window.PhoenixSupabase = {
    configure: function (url, anonKey) {
      config.url = url;
      config.anonKey = anonKey;
      if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
        client = window.supabase.createClient(url, anonKey);
      }
    },

    getClient: getClient,

    /**
     * Login via Supabase Auth and fetch the unified user profile
     */
    login: async function (email, password) {
      const sb = getClient();
      if (!sb) {
        throw new Error('Supabase client not initialized. Please configure url and anonKey.');
      }

      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Fetch user profile and permissions via RPC
      const { data: profile, error: rpcError } = await sb.rpc('get_current_user_profile');
      if (rpcError) {
        console.warn('RPC get_current_user_profile warning:', rpcError);
      }

      return {
        session: data.session,
        user: data.user,
        profile: profile || null
      };
    },

    /**
     * Sign out
     */
    logout: async function () {
      const sb = getClient();
      if (sb) {
        await sb.auth.signOut();
      }
    }
  };
})(window);

