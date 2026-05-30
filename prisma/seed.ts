import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const riderPassword = await bcrypt.hash("password123", 12);
  const driverPassword = await bcrypt.hash("password123", 12);
  const adminPassword = await bcrypt.hash("password123", 12);

  const rider = await prisma.user.upsert({
    where: { email: "rider@movee.com" },
    update: {},
    create: {
      email: "rider@movee.com",
      passwordHash: riderPassword,
      name: "Alex Rider",
      phone: "+1 555-0100",
      role: "RIDER",
    },
  });

  const driver = await prisma.user.upsert({
    where: { email: "driver@movee.com" },
    update: {},
    create: {
      email: "driver@movee.com",
      passwordHash: driverPassword,
      name: "Sam Driver",
      phone: "+1 555-0200",
      role: "DRIVER",
      driverProfile: {
        create: {
          isOnline: false,
          licenseNumber: "DL-123456",
          vehicleMake: "Toyota",
          vehicleModel: "Camry",
          vehiclePlate: "MOVE-001",
          vehicleColor: "Silver",
          currentLat: 40.7128,
          currentLng: -74.006,
          documentsVerified: true,
        },
      },
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@movee.com" },
    update: {},
    create: {
      email: "admin@movee.com",
      passwordHash: adminPassword,
      name: "Movee Admin",
      phone: "+1 555-0300",
      role: "ADMIN",
    },
  });

  console.log("Seeded:", { rider: rider.email, driver: driver.email, admin: admin.email });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
