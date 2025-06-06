import NextAuth from "next-auth";
import { authOptions } from "@/app/pages/login/control/authOptions";

export const dynamic = "force-dynamic";
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
