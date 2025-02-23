import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.approval.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.division.deleteMany();
  await prisma.role.deleteMany();

  // Create roles
  const direkturRole = await prisma.role.create({
    data: { name: "Direktur" },
  });

  const hrdRole = await prisma.role.create({
    data: { name: "HRD" },
  });

  const kepalaDivisiRole = await prisma.role.create({
    data: { name: "Kepala Divisi" },
  });

  const karyawanRole = await prisma.role.create({
    data: { name: "Karyawan" },
  });

  // Create Direktur
  const direktur = await prisma.user.create({
    data: {
      name: "Direktur Utama",
      email: "direktur@company.com",
      nik: "DIR001",
      password: await bcrypt.hash("password123", 10),
      roleId: direkturRole.id,
    },
  });

  // Create HRD
  const hrd = await prisma.user.create({
    data: {
      name: "HRD Manager",
      email: "hrd@company.com",
      nik: "HRD001",
      password: await bcrypt.hash("password123", 10),
      roleId: hrdRole.id,
    },
  });

  // Create 5 divisions with their respective heads and employees
  const divisions = ["IT", "Finance", "Marketing", "Operations", "Sales"];

  for (let i = 0; i < divisions.length; i++) {
    const division = await prisma.division.create({
      data: {
        name: divisions[i],
      },
    });

    // Create Kepala Divisi
    const kepalaDiv = await prisma.user.create({
      data: {
        name: `Kepala ${divisions[i]}`,
        email: `kepala.${divisions[i].toLowerCase()}@company.com`,
        nik: `KD${String(i + 1).padStart(3, "0")}`,
        password: await bcrypt.hash("password123", 10),
        roleId: kepalaDivisiRole.id,
        divisionId: division.id,
      },
    });

    // Create 5 Karyawan for each division
    for (let j = 0; j < 5; j++) {
      await prisma.user.create({
        data: {
          name: `${divisions[i]} Staff ${j + 1}`,
          email: `${divisions[i].toLowerCase()}.staff${j + 1}@company.com`,
          nik: `${divisions[i].substring(0, 2).toUpperCase()}${String(j + 1).padStart(3, "0")}`,
          password: await bcrypt.hash("password123", 10),
          roleId: karyawanRole.id,
          divisionId: division.id,
        },
      });
    }
  }

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
