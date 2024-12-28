import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Debt, formatCurrency, calculatePayoffTime } from "@/lib/strategies";
import { motion } from "framer-motion";

interface DebtTableProps {
  debts: Debt[];
  monthlyPayment?: number;
}

export const DebtTable = ({ debts, monthlyPayment = 0 }: DebtTableProps) => {
  const calculateTotalInterest = (debt: Debt, months: number) => {
    const totalPaid = debt.minimumPayment * months;
    return totalPaid - debt.balance;
  };

  const calculatePayoffDate = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const totals = debts.reduce(
    (acc, debt) => {
      const months = calculatePayoffTime(debt, monthlyPayment);
      const totalInterest = calculateTotalInterest(debt, months);
      return {
        balance: acc.balance + debt.balance,
        minimumPayment: acc.minimumPayment + debt.minimumPayment,
        totalInterest: acc.totalInterest + totalInterest,
      };
    },
    { balance: 0, minimumPayment: 0, totalInterest: 0 }
  );

  return (
    <div className="rounded-lg border bg-white/50 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Banking Institution</TableHead>
            <TableHead>Debt Name</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Interest Rate</TableHead>
            <TableHead>Minimum Payment</TableHead>
            <TableHead>Total Interest Paid</TableHead>
            <TableHead>Months to Payoff</TableHead>
            <TableHead>Payoff Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {debts.map((debt, index) => {
            const months = calculatePayoffTime(debt, monthlyPayment);
            const totalInterest = calculateTotalInterest(debt, months);
            
            return (
              <motion.tr
                key={debt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="hover:bg-muted/50"
              >
                <TableCell>{debt.bankerName}</TableCell>
                <TableCell className="font-medium">{debt.name}</TableCell>
                <TableCell className="number-font">{formatCurrency(debt.balance)}</TableCell>
                <TableCell className="number-font">{debt.interestRate}%</TableCell>
                <TableCell className="number-font">{formatCurrency(debt.minimumPayment)}</TableCell>
                <TableCell className="number-font">{formatCurrency(totalInterest)}</TableCell>
                <TableCell className="number-font">{months} months</TableCell>
                <TableCell className="number-font">{calculatePayoffDate(months)}</TableCell>
              </motion.tr>
            );
          })}
          <TableRow className="font-bold bg-muted/20">
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell className="number-font">{formatCurrency(totals.balance)}</TableCell>
            <TableCell>-</TableCell>
            <TableCell className="number-font">{formatCurrency(totals.minimumPayment)}</TableCell>
            <TableCell className="number-font">{formatCurrency(totals.totalInterest)}</TableCell>
            <TableCell colSpan={2}>-</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};