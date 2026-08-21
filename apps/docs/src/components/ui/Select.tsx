import type { ChangeEvent } from 'react'
import { LuChevronDown } from 'react-icons/lu'

export type SelectOption<T extends string> = {
  value: T
  label: string
}

type SelectProps<T extends string> = {
  value: T
  options: readonly SelectOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
  id?: string
  name?: string
  'aria-label'?: string
}

export function Select<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  size = 'md',
  className,
  id,
  name,
  'aria-label': ariaLabel,
}: SelectProps<T>) {
  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    onChange(e.target.value as T)
  }

  const rootClass = ['ui-select', `ui-select-${size}`, className].filter(Boolean).join(' ')

  return (
    <span className={rootClass}>
      <select
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={handleChange}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <LuChevronDown className="ui-select-chevron" size={14} aria-hidden />
    </span>
  )
}
