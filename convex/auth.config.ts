// Convex auth config for Supabase JWT verification
// The JWKS endpoint allows Convex to verify Supabase-issued JWTs

const authConfig = {
  providers: [
    {
      // Supabase uses RS256 JWTs
      domain: process.env.SUPABASE_URL
        ? `${process.env.SUPABASE_URL}/auth/v1`
        : 'https://svaxyhjoanqvadottcda.supabase.co/auth/v1',
      applicationID: 'supabase',
    },
  ],
}

export default authConfig
