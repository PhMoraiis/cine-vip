import { withAccelerate } from "@prisma/extension-accelerate";
import { JobStatus, PrismaClient } from "../../prisma/generated/client";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not defined");
}

const prisma = new PrismaClient({
	accelerateUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate());

export { JobStatus };
export default prisma;
