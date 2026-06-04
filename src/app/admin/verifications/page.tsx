import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { AdminVerifications } from "@/components/admin/AdminVerifications";

export default async function AdminVerificationsPage() {
  const session = await getSession();
  return (
    <div className="min-h-screen">
      <Navbar user={session ? { name: session.name, role: session.role } : null} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <AdminVerifications />
      </main>
    </div>
  );
}
