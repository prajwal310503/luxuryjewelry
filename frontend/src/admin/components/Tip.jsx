export default function Tip({ label, children }) {
  return (
    <span className="relative inline-flex group/tip">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-medium text-white bg-gray-800 opacity-0 group-hover/tip:opacity-100 transition-opacity z-[99999]">
        {label}
      </span>
    </span>
  );
}
