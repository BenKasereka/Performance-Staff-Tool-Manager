import type { NextAuthConfig } from "next-auth";

/**
 * Configuration compatible Edge (pas d'accès Prisma) : utilisée par le middleware.
 * Les providers qui touchent la base sont ajoutés dans src/auth.ts uniquement.
 */
export const authConfig = {
  // Sans ça, Auth.js rejette toute requête dont l'hôte ne correspond pas
  // exactement à AUTH_URL — trop fragile sur Vercel (domaine de prod,
  // alias, previews...). Vercel gère déjà le TLS et les en-têtes
  // X-Forwarded-*, donc faire confiance à l'hôte transmis est sûr ici.
  trustHost: true,
  pages: {
    signIn: "/connexion",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.nom = user.nom;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      if (token.nom) session.user.nom = token.nom;
      return session;
    },
  },
} satisfies NextAuthConfig;
