import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Debt, PaymentHistory } from "@/lib/types/debt";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";

export function useDebts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Query to check if profile exists
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log("Checking for user profile:", user.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  // Query to fetch debts
  const { data: debts, isLoading } = useQuery({
    queryKey: ["debts"],
    queryFn: async () => {
      console.log("Fetching debts for user:", user?.id);
      const { data, error } = await supabase
        .from("debts")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching debts:", error);
        toast({
          title: "Error",
          description: "Failed to fetch debts",
          variant: "destructive",
        });
        throw error;
      }

      return data as Debt[];
    },
    enabled: !!profile, // Only fetch debts if profile exists
  });

  // Mutation to create profile if it doesn't exist
  const createProfile = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("No user ID available");
      
      console.log("Creating profile for user:", user.id);
      const { data, error } = await supabase
        .from("profiles")
        .insert([{ id: user.id, email: user.email }])
        .select()
        .single();

      if (error) {
        console.error("Error creating profile:", error);
        throw error;
      }

      return data;
    },
  });

  const addDebt = useMutation({
    mutationFn: async (newDebt: Omit<Debt, "id">) => {
      if (!user?.id) throw new Error("No user ID available");
      
      // If profile doesn't exist, create it first
      if (!profile) {
        console.log("Profile doesn't exist, creating one first");
        await createProfile.mutateAsync();
      }

      console.log("Adding new debt:", newDebt);
      const { data, error } = await supabase
        .from("debts")
        .insert([newDebt])
        .select()
        .single();

      if (error) {
        console.error("Error adding debt:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast({
        title: "Success",
        description: "Debt added successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Error in addDebt mutation:", error);
      toast({
        title: "Error",
        description: "Failed to add debt. Please try signing out and signing back in.",
        variant: "destructive",
      });
    },
  });

  const updateDebt = useMutation({
    mutationFn: async (updatedDebt: Debt) => {
      const { data, error } = await supabase
        .from("debts")
        .update({
          name: updatedDebt.name,
          banker_name: updatedDebt.banker_name,
          balance: updatedDebt.balance,
          interest_rate: updatedDebt.interest_rate,
          minimum_payment: updatedDebt.minimum_payment,
          currency_symbol: updatedDebt.currency_symbol,
        })
        .eq("id", updatedDebt.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating debt:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast({
        title: "Success",
        description: "Debt updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update debt",
        variant: "destructive",
      });
    },
  });

  const recordPayment = useMutation({
    mutationFn: async (payment: Omit<PaymentHistory, "id">) => {
      const { data, error } = await supabase
        .from("payment_history")
        .insert([payment])
        .select()
        .single();

      if (error) {
        console.error("Error recording payment:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  return {
    debts,
    isLoading,
    addDebt,
    updateDebt,
    recordPayment,
    profile,
  };
}
