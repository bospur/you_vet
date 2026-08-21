import { type KeyboardEvent, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LuCheck, LuChevronDown } from 'react-icons/lu'

export type SelectOption<T extends string> = {
  value: T
  label: string
}

type SelectBase<T extends string> = {
  options: readonly SelectOption<T>[]
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
  id?: string
  'aria-label'?: string
}

export type SelectProps<T extends string> = SelectBase<T> &
  (
    | { multiple?: false; value: T; onChange: (value: T) => void }
    | { multiple: true; value: readonly T[]; onChange: (value: T[]) => void }
  )

export function Select<T extends string>(props: SelectProps<T>) {
  const { options, disabled = false, size = 'md', className, id, 'aria-label': ariaLabel } = props
  const multiple = props.multiple === true
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLSpanElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const selectedValues = multiple ? props.value : [props.value]
  const selectedSet = new Set(selectedValues)
  const selectedLabels = options.filter((o) => selectedSet.has(o.value)).map((o) => o.label)
  const triggerText = selectedLabels.length > 0 ? selectedLabels.join(', ') : 'Не указано'

  function firstSelectedIndex() {
    const idx = options.findIndex((o) => selectedSet.has(o.value))
    return Math.max(0, idx)
  }

  function openMenu() {
    setActive(firstSelectedIndex())
    setOpen(true)
  }

  useLayoutEffect(() => {
    if (!open) return
    const menu = menuRef.current

    function placeMenu() {
      const el = rootRef.current
      const panel = menuRef.current
      if (!el || !panel) return
      const rect = el.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const maxH = Math.min(options.length * 40 + 12, 280, vh - 16)
      const gap = 4
      const openUp = vh - rect.bottom < maxH && rect.top > vh - rect.bottom
      const width = Math.max(rect.width, size === 'sm' ? 148 : 168)
      const left = Math.min(Math.max(8, rect.left), Math.max(8, vw - width - 8))
      panel.style.left = `${left}px`
      panel.style.width = `${width}px`
      panel.style.maxHeight = `${maxH}px`
      panel.style.top = openUp ? 'auto' : `${rect.bottom + gap}px`
      panel.style.bottom = openUp ? `${vh - rect.top + gap}px` : 'auto'
    }

    placeMenu()
    menu?.focus()
    menu?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })

    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('resize', placeMenu)
    window.addEventListener('scroll', placeMenu, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('resize', placeMenu)
      window.removeEventListener('scroll', placeMenu, true)
    }
  }, [open, options.length, size])

  function choose(next: T) {
    if (props.multiple) {
      const set = new Set(props.value)
      if (set.has(next)) set.delete(next)
      else set.add(next)
      props.onChange(options.map((o) => o.value).filter((v) => set.has(v)))
      return
    }
    props.onChange(next)
    setOpen(false)
  }

  function onTriggerKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openMenu()
    }
  }

  function onMenuKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      rootRef.current?.querySelector('button')?.focus()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, options.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const opt = options[active]
      if (opt) choose(opt.value)
    }
  }

  const rootClass = [
    'ui-select',
    `ui-select-${size}`,
    open ? 'is-open' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span ref={rootRef} className={rootClass}>
      <button
        type="button"
        id={id}
        className="ui-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => {
          if (disabled) return
          if (open) setOpen(false)
          else openMenu()
        }}
        onKeyDown={onTriggerKey}
      >
        <span className="ui-select-value">{triggerText}</span>
      </button>
      <LuChevronDown className="ui-select-chevron" size={14} aria-hidden />
      {open
        ? createPortal(
            <>
              <div
                className="ui-select-backdrop"
                aria-hidden
                onPointerDown={(e) => {
                  e.preventDefault()
                  setOpen(false)
                }}
              />
              <div
                ref={menuRef}
                id={listId}
                className={`ui-select-menu ui-select-menu-${size}`}
                role="listbox"
                tabIndex={-1}
                aria-multiselectable={multiple || undefined}
                aria-label={ariaLabel}
                onKeyDown={onMenuKey}
              >
              {options.map((opt, i) => {
                const isOn = selectedSet.has(opt.value)
                return (
                  <button
                    key={opt.value === '' ? `empty-${i}` : opt.value}
                    type="button"
                    role="option"
                    aria-selected={isOn}
                    className={[
                      'ui-select-option',
                      isOn ? 'is-selected' : '',
                      i === active ? 'is-active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(opt.value)}
                  >
                    <span>{opt.label}</span>
                    {isOn ? <LuCheck size={14} aria-hidden /> : null}
                  </button>
                )
              })}
              </div>
            </>,
            document.body,
          )
        : null}
    </span>
  )
}
