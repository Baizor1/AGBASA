export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
            Agbasa
          </span>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            &copy; {new Date().getFullYear()} Agbasa. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
