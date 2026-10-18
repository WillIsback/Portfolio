// auth.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { isAdminSession } from "@/lib/admin-guard";
import {
	jwtCallback,
	sessionCallback,
	signInCallback,
} from "@/lib/auth-callbacks";

export const { handlers, auth, signIn, signOut } = NextAuth({
	providers: [
		GitHub({ authorization: { params: { scope: "read:user repo" } } }),
	],
	callbacks: {
		signIn: signInCallback,
		jwt: jwtCallback,
		session: sessionCallback,
		authorized({ auth: session, request: { nextUrl } }) {
			const isLoginPage = nextUrl.pathname === "/admin/login";
			if (isLoginPage) return true;

			if (!session?.user) return false;

			if (!isAdminSession(session))
				return Response.redirect(new URL("/admin/login", nextUrl));

			return true;
		},
	},
	pages: { signIn: "/admin/login" },
});
