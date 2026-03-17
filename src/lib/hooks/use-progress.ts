import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type ProgressMap = Record<string, { completed: boolean; bookmarked: boolean }>;

async function fetchProgress(courseSlug: string): Promise<ProgressMap> {
  const res = await fetch(`/api/progress?courseSlug=${courseSlug}`);
  if (!res.ok) throw new Error("Failed to fetch progress");
  return res.json();
}

async function updateProgress(body: {
  courseSlug: string;
  caseId: string;
  completed?: boolean;
  bookmarked?: boolean;
}) {
  const res = await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update progress");
}

export function useProgress(courseSlug: string) {
  const queryClient = useQueryClient();
  const queryKey = ["progress", courseSlug] as const;

  const { data: progress = {}, isLoading } = useQuery<ProgressMap>({
    queryKey,
    queryFn: () => fetchProgress(courseSlug),
  });

  const mutation = useMutation({
    mutationFn: updateProgress,
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<ProgressMap>(queryKey);

      queryClient.setQueryData<ProgressMap>(queryKey, (old = {}) => ({
        ...old,
        [vars.caseId]: {
          completed: vars.completed ?? old[vars.caseId]?.completed ?? false,
          bookmarked: vars.bookmarked ?? old[vars.caseId]?.bookmarked ?? false,
        },
      }));

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/progress?courseSlug=${courseSlug}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to clear progress");
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<ProgressMap>(queryKey);
      queryClient.setQueryData<ProgressMap>(queryKey, () => ({}));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
  });

  return {
    progress,
    isLoading,
    markCompleted: (caseId: string, completed = true) =>
      mutation.mutate({ courseSlug, caseId, completed }),
    toggleBookmark: (caseId: string) =>
      mutation.mutate({
        courseSlug,
        caseId,
        bookmarked: !progress[caseId]?.bookmarked,
      }),
    clearProgress: () => clearMutation.mutate(),
  };
}
