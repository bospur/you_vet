import {
  type FormEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { LuMaximize2, LuMinimize2 } from 'react-icons/lu'

const EXPAND_PX = 48
const CLOSE_PX = 88
const COLLAPSE_PX = 96

type BoardDrawerProps = {
  title: ReactNode
  titleId: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  as?: 'div' | 'form'
  onSubmit?: (e: FormEvent) => void
}

export function BoardDrawer({
  title,
  titleId,
  onClose,
  children,
  footer,
  as = 'div',
  onSubmit,
}: BoardDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLElement | null>(null)
  const drag = useRef({ active: false, startY: 0, dy: 0 })
  const onCloseRef = useRef(onClose)
  const [expanded, setExpanded] = useState(false)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    html.classList.add('board-drawer-open')
    body.classList.add('board-drawer-open')
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)

    const overlay = overlayRef.current
    function onTouchMove(e: TouchEvent) {
      const target = e.target as HTMLElement | null
      if (target?.closest('.board-modal-scroll, textarea, input, select')) return
      if (target?.closest('.board-modal-handle-hit')) return
      e.preventDefault()
    }
    overlay?.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      html.classList.remove('board-drawer-open')
      body.classList.remove('board-drawer-open')
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      window.removeEventListener('keydown', onKey)
      overlay?.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  const resetShift = useCallback(() => {
    const el = sheetRef.current
    if (el) el.style.transform = ''
  }, [])

  function onHandlePointerDown(e: PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return
    drag.current = { active: true, startY: e.clientY, dy: 0 }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onHandlePointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (!drag.current.active) return
    const dy = e.clientY - drag.current.startY
    drag.current.dy = dy
    const el = sheetRef.current
    if (!el) return
    if (dy > 0) el.style.transform = `translateY(${dy}px)`
    else el.style.transform = expanded ? '' : `translateY(${dy}px)`
  }

  function onHandlePointerUp() {
    if (!drag.current.active) return
    const dy = drag.current.dy
    drag.current.active = false
    setDragging(false)
    resetShift()
    if (Math.abs(dy) < 10) {
      setExpanded((v) => !v)
      return
    }
    if (expanded) {
      if (dy > COLLAPSE_PX) setExpanded(false)
      return
    }
    if (dy < -EXPAND_PX) setExpanded(true)
    else if (dy > CLOSE_PX) onCloseRef.current()
  }

  const sheetClass = [
    'board-modal',
    expanded ? 'is-expanded' : '',
    dragging ? 'is-dragging' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const inner = (
    <>
      <button
        type="button"
        className="board-modal-handle-hit"
        aria-label={expanded ? 'Свернуть' : 'На весь экран'}
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
      >
        <span className="board-modal-handle" />
      </button>
      <div className="board-modal-head">
        <h2 id={titleId}>{title}</h2>
        <div className="board-modal-head-actions">
          <button
            type="button"
            className="board-icon-btn board-modal-expand"
            aria-label={expanded ? 'Свернуть' : 'На весь экран'}
            title={expanded ? 'Свернуть' : 'На весь экран'}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <LuMinimize2 size={16} aria-hidden /> : <LuMaximize2 size={16} aria-hidden />}
          </button>
          <button type="button" className="board-modal-close" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
      <div className="board-modal-scroll">{children}</div>
      {footer ? <div className="board-modal-footer">{footer}</div> : null}
    </>
  )

  const setSheetRef = (el: HTMLElement | null) => {
    sheetRef.current = el
  }

  return (
    <div
      ref={overlayRef}
      className="board-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      {as === 'form' ? (
        <form
          ref={setSheetRef}
          className={sheetClass}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(e) => e.stopPropagation()}
          onSubmit={onSubmit}
        >
          {inner}
        </form>
      ) : (
        <div
          ref={setSheetRef}
          className={sheetClass}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(e) => e.stopPropagation()}
        >
          {inner}
        </div>
      )}
    </div>
  )
}

