import { type BetterAuthOptions, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import { Resend } from "resend";
import Prisma from "@/db";

const resend = new Resend(process.env.RESEND_API_KEY as string);

export const auth = betterAuth<BetterAuthOptions>({
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
	database: prismaAdapter(Prisma, {
		provider: "postgresql",
	}),
	trustedOrigins: [
		"https://oncine.philipemorais.com",
  	"https://www.oncine.philipemorais.com",
    process.env.CORS_ORIGIN || "http://localhost:3001",
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ],
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
		},
	},
	 advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
      partitioned: true,
    },
	},
	plugins: [
		magicLink({
			sendMagicLink: async ({ email, url }, _request) => {
				// Implement your email sending logic here
				await resend.emails.send({
					from: "noreply@philipemorais.com",
					to: email,
					subject: "OnCine - Your Magic Link",
					html: `<p>Click <a href="${url}">here</a> to log in.</p>`,
				});
			},
		}),
	],
});
