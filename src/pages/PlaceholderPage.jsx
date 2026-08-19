export default function PlaceholderPage({ title }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">
        Halaman ini siap dikembangkan.
      </p>
    </div>
  );
}
