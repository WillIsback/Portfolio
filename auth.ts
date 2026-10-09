// auth.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { jwtCallback, sessionCallback } from "@/lib/auth-callbacks";

type SessionUser = {
	githubId: string;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
	providers: [
		GitHub({ authorization: { params: { scope: "read:user repo" } } }),
	],
	callbacks: {
		jwt: jwtCallback,
		session: sessionCallback,
		authorized({ auth: session, request: { nextUrl } }) {
			const isLoginPage = nextUrl.pathname === "/admin/login";
			if (isLoginPage) return true;

			if (!session?.user) return false;

			const isAdmin =
				(session.user as SessionUser).githubId === process.env.ADMIN_GITHUB_ID;
			if (!isAdmin) return Response.redirect(new URL("/admin/login", nextUrl));

			return true;
		},
	},
	pages: { signIn: "/admin/login" },
});
