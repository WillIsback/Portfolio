// auth.ts
import NextAuth, { type DefaultSession } from "next-auth";
import GitHub from "next-auth/providers/github";

declare module "next-auth" {
  interface Session {
    user: { githubId: string } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    jwt({ token, profile }) {
      if (profile?.id) token.githubId = String(profile.id);
      return token;
    },
    session({ session, token }) {
      session.user.githubId = token.githubId as string;
      return session;
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoginPage = nextUrl.pathname === "/admin/login";
      if (isLoginPage) return true;

      if (!session?.user) return false;

      const isAdmin =
        session.user.githubId === process.env.ADMIN_GITHUB_ID;
      if (!isAdmin)
        return Response.redirect(new URL("/admin/login", nextUrl));

      return true;
    },
  },
  pages: { signIn: "/admin/login" },
});
