import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    nom: string;
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      nom: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

// next-auth/jwt ne fait que réexporter @auth/core/jwt : c'est ce module qu'il
// faut augmenter pour que le token soit correctement typé.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    nom?: string;
    role?: Role;
  }
}
