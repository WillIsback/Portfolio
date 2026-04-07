// app/(admin)/login/page.tsx
import { signIn } from "@/auth";

export default function AdminLoginPage() {
	return (
		<div className="min-h-screen bg-zinc-950 flex items-center justify-center">
			<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 flex flex-col items-center gap-6 w-80">
				<h1 className="text-lg font-semibold text-zinc-100 font-mono">Admin</h1>
				<p className="text-sm text-zinc-500 text-center">
					Accès réservé au propriétaire du portfolio.
				</p>
				<form
					action={async () => {
						"use server";
						await signIn("github", { redirectTo: "/admin/dashboard" });
					}}
				>
					<button
						type="submit"
						className="bg-zinc-100 text-zinc-900 px-5 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors"
					>
						Sign in with GitHub
					</button>
				</form>
			</div>
		</div>
	);
}
