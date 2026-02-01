import Image from "next/image";
import Link from "next/link";
import avatarSrc from "@/app/assets/coin_profile_pic.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Footer() {
	return (
		<footer className="flex justify-between items-center w-full bg-white border border-border/60 px-13 py-4 mt-10">
			<div className="flex gap-4 items-center">
				<Avatar className="size-12 ring-2 ring-white/70 shadow-lg shadow-sky-500/25 dark:ring-black/60">
					<AvatarImage src={avatarSrc.src} alt="Portrait de William Derue" />
					<AvatarFallback>WD</AvatarFallback>
				</Avatar>
				<p className="text-2xl font-bold">Portfolio</p>
			</div>
			<div className="flex gap-2 items-center">
				<p className="text-sm">Copyright notice (e.g., © 2026 Willam Derue)</p>
				<Link href="https://github.com/WillIsback/">
					<Image
						src={"/icon/Github.svg"}
						alt="lien vers le github"
						width={24}
						height={24}
					/>
				</Link>
			</div>
		</footer>
	);
}
