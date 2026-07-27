import React, { useState, useRef, useEffect } from 'react';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  disabled = false,
  style = {},
  dropdownStyle = {},
  selectStyle = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val, optDisabled) => {
    if (optDisabled) return;
    setIsOpen(false);
    if (onChange) {
      onChange({ target: { value: val } });
    }
  };

  // Normalize options to [{ value, label, disabled }]
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value,
        label: opt.label || opt.value,
        disabled: !!opt.disabled
      };
    }
    return { value: opt, label: opt, disabled: false };
  });

  const selectedOption = normalizedOptions.find(o => String(o.value) === String(value));

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        fontFamily: 'inherit',
        userSelect: 'none',
        ...style
      }}
    >
      {/* Select button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 16px',
          fontSize: '13px',
          fontWeight: '600',
          background: 'var(--bg-input)',
          border: 'var(--border)',
          borderRadius: 'var(--radius-md)',
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.6 : 1,
          textAlign: 'left',
          ...selectStyle
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {/* Simple chevron arrow icon */}
        <span
          style={{
            display: 'inline-block',
            borderTop: isOpen ? '0' : '5px solid var(--text-secondary)',
            borderBottom: isOpen ? '5px solid var(--text-secondary)' : '0',
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            transition: 'transform 0.2s ease',
            flexShrink: 0
          }}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'var(--bg-surface)',
            border: 'var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '6px 0',
            ...dropdownStyle
          }}
        >
          {normalizedOptions.length === 0 ? (
            <div style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
              No options
            </div>
          ) : (
            normalizedOptions.map(opt => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={String(opt.value)}
                  onClick={() => handleSelect(opt.value, opt.disabled)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: isSelected ? '700' : '500',
                    color: opt.disabled
                      ? 'var(--text-muted)'
                      : isSelected
                      ? 'var(--primary-light)'
                      : 'var(--text-primary)',
                    background: isSelected
                      ? 'var(--primary-glow-sm)'
                      : 'transparent',
                    cursor: opt.disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={e => {
                    if (!opt.disabled && !isSelected) {
                      e.currentTarget.style.background = 'var(--bg-card-hover)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!opt.disabled && !isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {opt.label}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
