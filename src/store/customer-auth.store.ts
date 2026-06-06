"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StoreCustomer } from "@/types/store";

interface CustomerAuthStore {
  customer: StoreCustomer | null;
  isLoading: boolean;
  setCustomer: (customer: StoreCustomer | null) => void;
  logout: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
}

export const useCustomerAuthStore = create<CustomerAuthStore>()(
  persist(
    (set) => ({
      customer: null,
      isLoading: false,

      setCustomer: (customer) => set({ customer }),

      logout: async () => {
        await fetch("/api/store/auth/logout", { method: "POST" });
        set({ customer: null });
      },

      refreshCustomer: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/store/auth/me");
          const data = await res.json();
          set({ customer: data.success ? data.data : null });
        } catch {
          set({ customer: null });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    { name: "sunny-pet-customer" }
  )
);
