import { magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_SERVER_URL || "https://oncine.onrender.com",
	plugins: [magicLinkClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
