import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  if (process.env.NODE_ENV === "development") {
    const payloadBytes = data ? JSON.stringify(data).length : 0;
    console.debug("[apiRequest]", method, url, payloadBytes ? { payloadBytes } : {});
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[apiRequest] Network error:", { method, url, message, err });
    if (/failed to fetch|networkerror|load failed/i.test(message)) {
      throw new Error(
        "NETWORK: Cannot reach the server. Start the app from Smart-Edu-Hub\\Smart-Edu-Hub with npm run dev:local and open the URL shown in the terminal (usually http://localhost:5000).",
      );
    }
    throw err instanceof Error ? err : new Error(message);
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
