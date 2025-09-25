import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "../../prisma/generated/client";

const prisma = new PrismaClient().$extends(withAccelerate());

export default prisma;
