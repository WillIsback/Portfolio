import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin-guard";

/** Vrai si la session appartient à l'admin (`ADMIN_GITHUB_ID` non vide). */
export async function requireAdmin(): Promise<boolean> {
	const session = await auth();
	return isAdminSession(session);
}
