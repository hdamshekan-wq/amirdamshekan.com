import Link from "next/link";
import { getAuthenticatedIdentity } from "@/lib/auth";

export async function MarineStrucAccountNav() {
  const identity = await getAuthenticatedIdentity();
  return identity ? (
    <Link href="/account" className="font-medium hover:text-teal-700">My Account</Link>
  ) : (
    <div className="flex items-center gap-3"><Link href="/login" className="font-medium hover:text-teal-700">Login</Link><Link href="/signup" className="rounded-lg bg-teal-700 px-3 py-2 font-semibold text-white">Sign Up</Link></div>
  );
}
