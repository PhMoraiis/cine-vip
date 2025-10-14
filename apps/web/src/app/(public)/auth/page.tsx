"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const loginSchema = z.object({
	email: z.string().email("Por favor, insira um email válido."),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const router = useRouter();
	const [isEmailSent, setIsEmailSent] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const [isGithubLoading, setIsGithubLoading] = useState(false);
	const emailId = useId();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setError,
		reset,
		watch,
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	const email = watch("email");

	const onSubmit = async (data: LoginFormData) => {
		try {
			await authClient.signIn.magicLink({
				email: data.email,
				callbackURL: `${window.location.origin}/auth/callback`,
			});
			
			setIsEmailSent(true);
		} catch (err) {
			console.error("Magic link error:", err);
			setError("root", {
				message: "Erro ao enviar o link mágico. Tente novamente.",
			});
		}
	};

	const handleSendToAnotherEmail = () => {
		setIsEmailSent(false);
		reset();
	};

	const handleGithubLogin = async () => {
		setIsGithubLoading(true);
		try {
			await authClient.signIn.social({
				provider: "github",
				callbackURL: `${window.location.origin}/auth/callback`,
			});
		} catch (err) {
			console.error("GitHub login error:", err);
			setError("root", {
				message: "Erro ao redirecionar para o GitHub. Tente novamente.",
			});
			setIsGithubLoading(false);
		}
	};

	const handleGoogleLogin = async () => {
		setIsGoogleLoading(true);
		try {
			await authClient.signIn.social({
				provider: "google",
				callbackURL: `${window.location.origin}/auth/callback`,
			});
		} catch (err) {
			console.error("Google login error:", err);
			setError("root", {
				message: "Erro ao redirecionar para o Google. Tente novamente.",
			});
			setIsGoogleLoading(false);
		}
	};

	return (
		<section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
			<Button
				variant="link"
				className="absolute top-4 left-4 cursor-pointer text-ring"
				onClick={() => {
					router.back();
				}}
			>
				<ArrowLeft /> Voltar
			</Button>
			<div className="m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border bg-card p-0.5 shadow-md dark:[--color-muted:var(--color-zinc-900)]">
				<div className="p-8 pb-6">
					<div>
						<Link href="/" aria-label="go home">
							<Image src="/switch.png" alt="Logo" width={32} height={32} />
						</Link>
						<h1 className="mt-4 mb-1 font-semibold text-xl">
							Entrar no OnCine
						</h1>
						<p className="text-sm">
							Bem-vindo de volta! Faça login para continuar
						</p>
					</div>

					<div className="mt-6 grid grid-cols-2 gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={handleGoogleLogin}
							className="cursor-pointer"
							disabled={isGoogleLoading || isGithubLoading}
						>
							{isGoogleLoading ? (
								<>
									<LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
									<span>Google</span>
								</>
							) : (
								<>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="0.98em"
										height="1em"
										viewBox="0 0 256 262"
									>
										<title>Google</title>
										<path
											fill="#4285f4"
											d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
										/>
										<path
											fill="#34a853"
											d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
										/>
										<path
											fill="#fbbc05"
											d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
										/>
										<path
											fill="#eb4335"
											d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
										/>
									</svg>
									<span>Google</span>
								</>
							)}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={handleGithubLogin}
							className="cursor-pointer"
							disabled={isGoogleLoading || isGithubLoading}
						>
							{isGithubLoading ? (
								<>
									<LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
									<span>Github</span>
								</>
							) : (
								<>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										fill="currentColor"
										viewBox="0 0 16 16"
									>
										<title>GitHub</title>
										<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
									</svg>
									<span>Github</span>
								</>
							)}
						</Button>
					</div>

					<div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
						<hr className="border-dashed" />
						<span className="text-muted-foreground text-xs">
							Ou continue com
						</span>
						<hr className="border-dashed" />
					</div>

					{isEmailSent ? (
						<div className="space-y-4">
							<div className="rounded-lg border-2 bg-transparent p-4 text-center shadow-2xl">
								<h3 className="font-medium text-green-200">Email enviado!</h3>
								<p className="text-sm text-white">
									Verifique sua caixa de entrada e utilize o link para entrar no
									OnCine.
								</p>
							</div>
							<Button
								variant="outline"
								className="w-full"
								onClick={handleSendToAnotherEmail}
							>
								Enviar para outro email
							</Button>
						</div>
					) : (
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
							{errors.root && (
								<div className="rounded-lg bg-red-50 p-3 text-center">
									<p className="text-red-600 text-sm">{errors.root.message}</p>
								</div>
							)}

							<div className="space-y-2">
								<Label htmlFor={emailId} className="block text-sm">
									Email
								</Label>
								<Input
									id={emailId}
									type="email"
									{...register("email")}
									placeholder="bradpitt@example.com"
									disabled={isSubmitting}
								/>
								{errors.email && (
									<p className="text-red-600 text-sm">{errors.email.message}</p>
								)}
							</div>

							<Button
								type="submit"
								className="w-full"
								disabled={isSubmitting || !email}
							>
								{isSubmitting ? (
									<>
										<LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
										Enviando...
									</>
								) : (
									"Enviar"
								)}
							</Button>
						</form>
					)}
				</div>
			</div>
		</section>
	);
}
