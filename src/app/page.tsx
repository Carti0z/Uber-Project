import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect(
      session.role === "ADMIN"
        ? "/admin"
        : session.role === "DRIVER"
          ? "/driver"
          : "/rider"
    );
  }

  return <LandingPage />;
}
