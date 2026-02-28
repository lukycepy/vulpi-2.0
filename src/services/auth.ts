import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import { Role } from "@/types";

export async function signUp(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationName: string;
}) {
  const { email, password, firstName, lastName, organizationName } = data;
  
  // Hash password
  const hashedPassword = await hash(password, 10);

  // Use transaction to ensure atomicity
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if user exists
      const existingUser = await tx.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new Error("User already exists");
      }

      // 2. Create User
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          firstName,
          lastName,
        },
      });

      // 3. Create Organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
        },
      });

      // 4. Create Membership (ADMIN)
      await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: Role.ADMIN,
        },
      });

      return { user, organization };
    });

    return result;
  } catch (error: any) {
    throw new Error(error.message || "Registration failed");
  }
}

export async function signIn(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isValid = await compare(password, user.passwordHash);
  
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  return user;
}
