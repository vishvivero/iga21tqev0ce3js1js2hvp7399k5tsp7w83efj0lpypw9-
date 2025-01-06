import { Debt } from "@/lib/types/debt";
import { PayoffDetails, Strategy, AllocationResult } from "../types";
import { calculatePayoffDetails } from "../payoff/payoffCalculator";

export const calculateMonthlyAllocations = (
  debts: Debt[],
  totalMonthlyPayment: number,
  selectedStrategy: Strategy
): AllocationResult => {
  const sortedDebts = selectedStrategy.calculate([...debts]);
  const allocations = new Map<string, number>();
  
  // Initialize with minimum payments
  let remainingPayment = totalMonthlyPayment;
  sortedDebts.forEach(debt => {
    const minPayment = Math.min(debt.minimum_payment, remainingPayment);
    allocations.set(debt.id, minPayment);
    remainingPayment -= minPayment;
  });

  // Allocate remaining payment to highest priority debt
  if (remainingPayment > 0 && sortedDebts.length > 0) {
    const highestPriorityDebt = sortedDebts[0];
    const currentAllocation = allocations.get(highestPriorityDebt.id) || 0;
    allocations.set(highestPriorityDebt.id, currentAllocation + remainingPayment);
  }

  const payoffDetails = calculatePayoffDetails(sortedDebts, totalMonthlyPayment, selectedStrategy);

  return { allocations, payoffDetails };
};