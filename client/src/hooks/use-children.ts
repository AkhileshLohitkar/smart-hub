import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Child } from "@shared/schema";

export function useChildren() {
  return useQuery<Child[]>({
    queryKey: ["/api/children"],
  });
}

export function useCreateChild() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { name: string; board: string; className: string }) => {
      const res = await apiRequest("POST", "/api/children", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      toast({ title: "Child added", description: "Child profile has been created." });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add child",
        description: error.message.includes("400") ? "You've reached your plan's child limit" : error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteChild() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/children/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      toast({ title: "Child removed", description: "Child profile has been deleted." });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete child",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
