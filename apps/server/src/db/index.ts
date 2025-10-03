import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "../../prisma/generated/client";

const Prisma = new PrismaClient().$extends(withAccelerate());

export default Prisma;
