import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { DriverEarnings } from "@/components/driver/DriverEarnings";

export default async function DriverEarningsPage() {
  const session = await getSession();
  return (
    <div className="min-h-screen">
      <Navbar user={session ? { name: session.name, role: session.role } : null} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <DriverEarnings />
      </main>
    </div>
  );
}
