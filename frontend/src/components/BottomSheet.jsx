import { useRef, useState } from 'react'

export default function BottomSheet({ title, onClose, children }) {
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startedRef = useRef(false)
  const startYRef = useRef(0)

  const onTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY
    startedRef.current = true
    setDragging(true)
  }

  const onTouchMove = (e) => {
    if (!dragging) return
    const dy = e.touches[0].clientY - startYRef.current
    setDragY(dy > 0 ? dy * 0.92 : 0)
  }

  const onTouchEnd = () => {
    setDragging(false)
    if (dragY > 110) {
      onClose()
    } else {
      setDragY(0)
    }
  }

  const sheetClass = dragging ? 'dragging' : startedRef.current ? 'settling' : ''

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className={`sheet ${sheetClass}`}
        style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sheet-grab"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="sheet-handle" />
          {title && <h2 className="sheet-title">{title}</h2>}
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}
