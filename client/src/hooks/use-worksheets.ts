import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl, type GenerateWorksheetInput, type WorksheetResponse } from "@shared/routes";

// ============================================
// WORKSHEET HOOKS
// ============================================

export function useGenerateWorksheet() {
  return useMutation({
    mutationFn: async (data: GenerateWorksheetInput) => {
      // The API path is defined in our route manifest
      const res = await fetch(api.worksheets.generate.path, {
        method: api.worksheets.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const errorData = await res.json();
          const error = api.worksheets.generate.responses[400].safeParse(errorData);
          throw new Error(error.success ? error.data.message : "Validation failed");
        }
        if (res.status === 403) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            typeof errorData?.message === "string"
              ? errorData.message
              : "You have reached your worksheet limit. Please upgrade your plan.",
          );
        }
        throw new Error("Failed to generate worksheet");
      }
      
      const responseData = await res.json();
      const parsed = api.worksheets.generate.responses[200].safeParse(responseData);
      
      if (!parsed.success) {
        console.error("[Zod] worksheet.generate validation failed:", parsed.error.format());
        throw new Error("Invalid response format from server");
      }
      
      return parsed.data;
    }
  });
}

export function useWorksheet(id: number | null) {
  return useQuery({
    queryKey: [api.worksheets.get.path, id],
    queryFn: async () => {
      if (id === null) return null;
      
      const url = buildUrl(api.worksheets.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch worksheet");
      
      const data = await res.json();
      const parsed = api.worksheets.get.responses[200].safeParse(data);
      
      if (!parsed.success) {
        console.error("[Zod] worksheet.get validation failed:", parsed.error.format());
        throw new Error("Invalid response format from server");
      }
      
      return parsed.data;
    },
    enabled: id !== null,
  });
}
