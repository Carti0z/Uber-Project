import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { DriverRequests } from "@/components/driver/DriverRequests";

export default async function DriverRequestsPage() {
  const session = await getSession();
  return (
    <div className="min-h-screen">
      <Navbar user={session ? { name: session.name, role: session.role } : null} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <DriverRequests />
      </main>
    </div>
  );
}
