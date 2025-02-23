import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const prisma = new PrismaClient();
const PORT = process.env.APP_PORT || 3000;

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  try {
    // Test database connection
    await prisma.$connect();
    console.log("Database connection established");

    // Create default roles if they don't exist
    const roles = ["Karyawan", "Kepala Divisi", "HRD", "Direktur"];
    for (const roleName of roles) {
      await prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName },
      });
    }
    console.log("Default roles created");
  } catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1);
  }
});
