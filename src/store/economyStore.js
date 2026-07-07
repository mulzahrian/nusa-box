import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const clampMoney = (amount) => Math.max(0, Number(amount) || 0);
const clampPercent = (value) => Math.min(100, Math.max(0, Number(value) || 0));
const createTransactionId = () => `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const buildTransaction = (type, amount, label, meta = {}) => ({
  id: createTransactionId(),
  type,
  amount: clampMoney(amount),
  label,
  meta,
  createdAt: new Date().toISOString(),
});

export const useEconomyStore = create(
  persist(
    (set, get) => ({
      money: 50000,
      income: 0,
      expense: 0,
      tax: 0.1,
      taxRate: 0.1,
      pollution: 18,
      baseMaintenance: 90,
      businessIncome: 0,
      transactions: [],

      earn: (amount, source = 'Pendapatan umum', meta = {}) =>
        set((state) => {
          const value = clampMoney(amount);
          return {
            money: state.money + value,
            income: state.income + value,
            transactions: [...state.transactions, buildTransaction('income', value, source, meta)],
          };
        }),

      spend: (amount, reason = 'Pengeluaran umum', meta = {}) =>
        set((state) => {
          const value = clampMoney(amount);
          return {
            money: Math.max(0, state.money - value),
            expense: state.expense + value,
            transactions: [...state.transactions, buildTransaction('expense', value, reason, meta)],
          };
        }),

      setTax: (rate) =>
        set(() => ({
          tax: Math.min(1, Math.max(0, Number(rate) || 0)),
          taxRate: Math.min(1, Math.max(0, Number(rate) || 0)),
        })),

      setTaxRate: (rate) =>
        set(() => ({
          tax: Math.min(1, Math.max(0, Number(rate) || 0)),
          taxRate: Math.min(1, Math.max(0, Number(rate) || 0)),
        })),

      setPollution: (pollution) =>
        set(() => ({
          pollution: clampPercent(pollution),
        })),
      addMoney: (amount, label = 'Reward level') =>
        set((state) => {
          const value = clampMoney(amount);
          return {
            money: state.money + value,
            income: state.income + value,
            transactions: [...state.transactions, buildTransaction('income', value, label)],
          };
        }),
      applyDailyEconomy: ({ income = 0, expenses = 0, businesses = 0 } = {}) =>
        set((state) => ({
          money: state.money + clampMoney(income) - clampMoney(expenses),
          income: clampMoney(income),
          expense: clampMoney(expenses),
          businessIncome: Math.max(0, clampMoney(income) - clampMoney(expenses)),
          pollution: clampPercent(state.pollution + businesses * 0.6 - 0.4),
          transactions: [
            ...state.transactions,
            buildTransaction('income', clampMoney(income), 'Pemasukan harian sistem'),
            buildTransaction('expense', clampMoney(expenses), 'Biaya maintenance harian'),
          ],
        })),

      calculateIncome: ({ baseIncome = 0, bonusIncome = 0, taxableAmount } = {}) => {
        const { tax } = get();
        const taxableBase = clampMoney(taxableAmount ?? baseIncome + bonusIncome);
        const totalIncome =
          clampMoney(baseIncome) + clampMoney(bonusIncome) + Math.round(taxableBase * tax);

        set((state) => ({
          money: state.money + totalIncome,
          income: state.income + totalIncome,
          transactions: [
            ...state.transactions,
            buildTransaction('income', totalIncome, 'Pemasukan harian', {
              baseIncome: clampMoney(baseIncome),
              bonusIncome: clampMoney(bonusIncome),
              taxableAmount: taxableBase,
              taxRate: tax,
            }),
          ],
        }));

        return totalIncome;
      },

      resetEconomy: () =>
        set(() => ({
          money: 50000,
          income: 0,
          expense: 0,
          tax: 0.1,
          taxRate: 0.1,
          pollution: 18,
          baseMaintenance: 90,
          businessIncome: 0,
          transactions: [],
        })),
    }),
    {
      name: 'nusa-box-economy-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
