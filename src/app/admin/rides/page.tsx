import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { AdminRides } from "@/components/admin/AdminRides";

export default async function AdminRidesPage() {
  const session = await getSession();
  return (
    <div className="min-h-screen">
      <Navbar user={session ? { name: session.name, role: session.role } : null} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <AdminRides />
      </main>
    </div>
  );
}
