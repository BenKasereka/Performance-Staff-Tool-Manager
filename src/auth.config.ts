import type { NextAuthConfig } from "next-auth";

/**
 * Configuration compatible Edge (pas d'accès Prisma) : utilisée par le middleware.
 * Les providers qui touchent la base sont ajoutés dans src/auth.ts uniquement.
 */
export const authConfig = {
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
