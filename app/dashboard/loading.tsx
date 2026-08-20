import AppShell from "@/components/layout/AppShell";

export default function DashboardLoading() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-5 border-b border-zinc-200 pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="h-8 w-48 bg-zinc-200 rounded-md"></div>
            <div className="mt-2 h-4 w-64 bg-zinc-200 rounded-md"></div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="h-11 w-32 bg-zinc-200 rounded-xl"></div>
            <div className="h-11 w-32 bg-zinc-200 rounded-xl"></div>
            <div className="h-11 w-40 bg-zinc-300 rounded-xl"></div>
          </div>
        </div>

        <div className="space-y-12">
          {/* Alerts Skeleton */}
          <section className="space-y-6">
            <div className="h-6 w-32 bg-zinc-200 rounded-md"></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="h-32 bg-red-50 rounded-2xl border border-red-100"></div>
              <div className="h-32 bg-amber-50 rounded-2xl border border-amber-100"></div>
              <div className="h-32 bg-red-50 rounded-2xl border border-red-100"></div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-64 bg-zinc-100 rounded-2xl"></div>
              <div className="h-64 bg-zinc-100 rounded-2xl"></div>
            </div>
          </section>

          {/* Metrics Skeleton */}
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="h-28 bg-zinc-100 rounded-2xl"></div>
                <div className="h-28 bg-zinc-100 rounded-2xl"></div>
                <div className="h-56 bg-zinc-100 rounded-2xl sm:row-span-2"></div>
                <div className="h-32 bg-zinc-100 rounded-2xl sm:col-span-2"></div>
              </div>
              <div className="h-64 bg-zinc-100 rounded-2xl"></div>
            </div>
            <div className="space-y-8">
              <div className="h-96 bg-zinc-100 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
