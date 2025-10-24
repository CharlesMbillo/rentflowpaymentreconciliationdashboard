'use client';
import { create } from 'zustand';

interface Payment {
  id: string;
  tenantId: string;
  amount: number;
  status: string;
  updatedAt: string;
}

interface DashboardState {
  payments: Payment[];
  updatePayment: (payment: Payment) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  payments: [],
  updatePayment: (payment) =>
    set((state) => {
      const existing = state.payments.find((p) => p.id === payment.id);
      if (existing) {
        return {
          payments: state.payments.map((p) =>
            p.id === payment.id ? { ...p, ...payment } : p
          ),
        };
      }
      return { payments: [...state.payments, payment] };
    }),
}));
