import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { RideHistoryList } from "@/components/rider/RideHistoryList";

export default async function RiderHistoryPage() {
  const session = await getSession();
  return (
    <div className="min-h-screen">
      <Navbar user={session ? { name: session.name, role: session.role } : null} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <RideHistoryList />
      </main>
    </div>
  );
}
