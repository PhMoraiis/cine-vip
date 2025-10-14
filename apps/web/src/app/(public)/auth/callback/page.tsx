"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";

export default function AuthCallbackPage() {
	const router = useRouter();
	const { data: session, isPending } = useSession();

	useEffect(() => {
		if (!isPending) {
			if (session?.user?.id) {
				// Redirecionar para o dashboard do usuário
				router.push(`/${session.user.id}/dashboard`);
			} else {
				// Se não houver sessão, voltar para o login
				router.push("/auth");
			}
		}
	}, [session, isPending, router]);

	return (
		<div className="min-h-screen bg-background">
			<header className="relative">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
					<Skeleton className="h-10 w-28" />
					<nav className="hidden items-center gap-7 md:flex">
						<Skeleton className="h-5 w-20" />
						<Skeleton className="h-5 w-20" />
						<Skeleton className="h-5 w-20" />
					</nav>
					<div className="flex items-center gap-3">
						<Skeleton className="h-9 w-32" />
					</div>
				</div>
				<div className="mx-auto max-w-7xl px-6 lg:px-8">
					<div className="h-px w-full bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
				</div>
			</header>
			<main className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
				<div className="mb-8">
					<Skeleton className="mb-2 h-9 w-64" />
					<Skeleton className="h-5 w-96" />
				</div>
				<Skeleton className="min-h-[400px] w-full" />
			</main>
		</div>
	);
}
