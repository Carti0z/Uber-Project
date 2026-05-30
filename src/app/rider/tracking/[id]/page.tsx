import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { RideTracking } from "@/components/rider/RideTracking";

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  const { id } = await params;

  return (
    <div className="min-h-screen">
      <Navbar user={session ? { name: session.name, role: session.role } : null} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <RideTracking rideId={id} />
      </main>
    </div>
  );
}
