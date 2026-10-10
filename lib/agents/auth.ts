import { auth } from "@/auth";

/** Vrai si la session appartient à l'admin (`ADMIN_GITHUB_ID` non vide). */
export async function requireAdmin(): Promise<boolean> {
	const adminId = process.env.ADMIN_GITHUB_ID;
	const session = await auth();
	return Boolean(adminId) && session?.user?.githubId === adminId;
}
