// auth.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import {
	authorizedCallback,
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
		authorized: authorizedCallback,
	},
	pages: { signIn: "/admin/login" },
});
