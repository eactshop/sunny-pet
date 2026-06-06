import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { StoreCustomer } from "@/types/store";

const JWT_SECRET = process.env.JWT_SECRET || "sunnypet-super-secret-key-2025";
const COOKIE_NAME = "customer_token";

export interface CustomerJwtPayload {
  customerId: string;
  name: string;
  phone: string;
  email?: string;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashed: string) {
  return bcrypt.compare(password, hashed);
}

export function signCustomerToken(payload: CustomerJwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyCustomerToken(token: string): CustomerJwtPayload {
  return jwt.verify(token, JWT_SECRET) as CustomerJwtPayload;
}

export async function getCustomerAuth(): Promise<CustomerJwtPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyCustomerToken(token);
  } catch {
    return null;
  }
}

export function setCustomerCookie(res: Response, token: string) {
  return token;
}

export { COOKIE_NAME };
