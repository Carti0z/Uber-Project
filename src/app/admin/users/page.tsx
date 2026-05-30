import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { AdminUsers } from "@/components/admin/AdminUsers";

export default async function AdminUsersPage() {
  const session = await getSession();
  return (
    <div className="min-h-screen">
      <Navbar user={session ? { name: session.name, role: session.role } : null} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <AdminUsers />
      </main>
    </div>
  );
}
