const authConfig = {
  // Two Clerk instances share this one Convex deployment — dev (localhost,
  // pk_test_ key) and prod (pk_live_ key) each issue tokens from their own
  // domain, so both must be trusted here.
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN_DEV,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
