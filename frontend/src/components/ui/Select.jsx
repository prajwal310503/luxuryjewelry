import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import React from 'react';

/**
 * Premium custom Select — drop-in replacement for <select className="input-luxury ...">
 *
 * The dropdown panel is rendered via React Portal into document.body so it always
 * floats above everything — no z-index / backdrop-filter stacking context issues.
 *
 * API mirrors native <select>:
 *   value, onChange (fires { target: { value } }), disabled, children (<option> tags), placeholder
 *
 * Extra props:
 *   compact   — shorter height (py-2 / text-sm), used for filter-bar selects
 *   className — applied to the outer wrapper div (controls width: w-40, flex-1, max-w-xs, etc.)
 */
function parseOptions(children) {
  return React.Children.toArray(children)
    .filter((c) => c.type === 'option')
    .map((c) => ({
      value: c.props.value !== undefined ? String(c.props.value) : String(c.props.children),
      label: c.props.children,
      disabled: !!c.props.disabled,
    }));
}

export default function Select({
  value,
  onChange,
  disabled = false,
  children,
  placeholder,
  className = '',
  compact = false,
  style,
}) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({});
  const wrapRef = useRef(null);
  const panelRef = useRef(null);

  const options = parseOptions(children);
  const selected = options.find((o) => o.value === String(value ?? ''));

  /* ── Position panel relative to trigger using getBoundingClientRect ── */
  const calcPosition = useCallback(() => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const panelH = Math.min(options.length * 44 + 12, 260);
    const flipped = spaceBelow < panelH + 12;

    setPanelStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
      ...(flipped
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
    });
  }, [options.length]);

  /* ── Open/close ─────────────────────────────────────────────────── */
  const handleToggle = () => {
    if (disabled) return;
    if (!open) calcPosition();
    setOpen((v) => !v);
  };

  /* ── Reposition on scroll/resize while open ─────────────────────── */
  useEffect(() => {
    if (!open) return;
    const update = () => calcPosition();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, calcPosition]);

  /* ── Close on outside click ─────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        !wrapRef.current?.contains(e.target) &&
        !panelRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* ── Close on Escape ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleSelect = (val) => {
    onChange?.({ target: { value: val } });
    setOpen(false);
  };

  const isPlaceholder = !selected || selected.value === '';
  const displayLabel = selected && selected.value !== ''
    ? selected.label
    : (placeholder || (selected?.label ?? 'Select…'));

  return (
    <div ref={wrapRef} className={`relative ${className}`} style={style}>
      {/* ── Trigger button ─────────────────────────────────────────── */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={[
          'input-luxury w-full flex items-center text-left',
          compact ? 'py-2 text-sm' : '',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
        style={{ paddingRight: '40px' }}
      >
        <span className={`truncate leading-none ${isPlaceholder ? 'text-gray-400' : 'text-gray-800'}`}>
          {displayLabel}
        </span>
      </button>

      {/* ── Chevron arrow ──────────────────────────────────────────── */}
      <motion.span
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center"
        style={{ color: 'rgba(90,65,63,0.55)' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </motion.span>

      {/* ── Dropdown panel — rendered into document.body via Portal ── */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: -6, scale: 0.975 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.975 }}
              transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
              style={{
                ...panelStyle,
                background: 'rgba(255,255,255,0.99)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1.5px solid rgba(90,65,63,0.13)',
                borderRadius: '14px',
                boxShadow: [
                  '0 16px 48px rgba(90,65,63,0.18)',
                  '0 4px 16px rgba(90,65,63,0.10)',
                  'inset 0 1px 0 rgba(255,255,255,0.95)',
                ].join(', '),
                maxHeight: '260px',
                overflowY: 'auto',
              }}
            >
              <ul className="py-1.5">
                {options.map((opt) => {
                  const isSel = opt.value === String(value ?? '');
                  return (
                    <li
                      key={opt.value}
                      onMouseDown={(e) => {
                        e.preventDefault(); // prevent blur before click
                        if (!opt.disabled) handleSelect(opt.value);
                      }}
                      className={[
                        'flex items-center justify-between px-4 py-2.5 text-sm transition-all duration-100 select-none',
                        opt.disabled
                          ? 'opacity-40 cursor-not-allowed text-gray-400'
                          : isSel
                            ? 'font-semibold cursor-pointer'
                            : 'text-gray-700 cursor-pointer',
                      ].join(' ')}
                      style={isSel ? { background: 'rgba(90,65,63,0.07)', color: '#5a413f' } : undefined}
                      onMouseEnter={(e) => {
                        if (!isSel && !opt.disabled) {
                          e.currentTarget.style.background = 'rgba(90,65,63,0.05)';
                          e.currentTarget.style.color = '#5a413f';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSel) {
                          e.currentTarget.style.background = '';
                          e.currentTarget.style.color = '';
                        }
                      }}
                    >
                      <span>{opt.label}</span>
                      {isSel && (
                        <svg
                          className="w-3.5 h-3.5 flex-shrink-0 ml-3"
                          style={{ color: '#5a413f' }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
