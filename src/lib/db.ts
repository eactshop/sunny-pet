import mysql from "mysql2/promise";

export async function getConnection() {
  return mysql.createConnection(
    process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet"
  );
}

export const nowVN = () => new Date().toISOString().slice(0, 19).replace("T", " ");
export const genId = () => Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 10);