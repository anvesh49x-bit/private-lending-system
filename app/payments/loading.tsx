import AppShell from "@/components/layout/AppShell";

export default function PaymentsLoading() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8 animate-pulse">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-8 w-48 bg-zinc-200 rounded-md"></div>
            <div className="mt-2 h-4 w-64 bg-zinc-200 rounded-md"></div>
          </div>
          <div className="h-11 w-40 bg-zinc-200 rounded-xl"></div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="h-11 w-full sm:w-64 bg-zinc-200 rounded-xl"></div>
          <div className="h-11 w-32 bg-zinc-200 rounded-xl"></div>
          <div className="h-11 w-32 bg-zinc-200 rounded-xl"></div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="bg-zinc-50 px-5 py-2.5">
            <div className="h-4 w-24 bg-zinc-200 rounded"></div>
          </div>
          <div className="divide-y divide-zinc-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-row items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-zinc-200"></div>
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-40 bg-zinc-200 rounded"></div>
                    <div className="h-3 w-32 bg-zinc-200 rounded"></div>
                  </div>
                </div>
                <div className="h-6 w-20 bg-zinc-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
