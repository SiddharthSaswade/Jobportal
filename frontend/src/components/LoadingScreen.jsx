export default function LoadingScreen() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <span className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
        <span className="text-sm font-medium">Checking your session…</span>
      </div>
    </div>
  );
}
