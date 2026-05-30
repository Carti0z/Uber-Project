import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { RiderBooking } from "@/components/rider/RiderBooking";

export default async function BookRidePage() {
  const session = await getSession();

  return (
    <div className="min-h-screen">
      <Navbar user={session ? { name: session.name, role: session.role } : null} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <RiderBooking />
      </main>
    </div>
  );
}
