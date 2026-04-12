function getPageNums(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export default function Pagination({ page, pages, total, shown, onPage }) {
  if (!pages || pages <= 1) return null;
  const nums = getPageNums(page, pages);
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-400">
        Showing <span className="font-medium text-gray-600">{shown}</span> of <span className="font-medium text-gray-600">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:border-primary hover:text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {nums.map((n, i) =>
          n === '...' ? (
            <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400 select-none">
              &hellip;
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors
                ${n === page
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                }`}
            >
              {n}
            </button>
          )
        )}

        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:border-primary hover:text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
