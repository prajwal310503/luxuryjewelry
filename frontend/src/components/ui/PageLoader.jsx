export default function PageLoader() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          <div className="absolute inset-3 rounded-full bg-primary/5 flex items-center justify-center">
            <span className="text-primary text-lg font-heading font-bold">L</span>
          </div>
        </div>
        <p className="text-primary/60 text-sm font-body tracking-widest uppercase">Loading</p>
      </div>
    </div>
  );
}
