"use client";
import { useState, useEffect } from "react";

interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (d.success) setUser(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const isOwner = user?.role === "OWNER";
  const isStaff = user?.role === "STAFF";
  const canDelete = isOwner;
  const canEdit = true; // cả 2 role đều sửa được

  return { user, loading, isOwner, isStaff, canDelete, canEdit };
}