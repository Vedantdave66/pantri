import { useEffect, useRef, useState } from 'react'

export default function AnimatedNumber({ value, duration = 750 }) {
  const target = typeof value === 'number' && Number.isFinite(value) ? value : 0
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    fromRef.current = target
    if (from === target) {
      setDisplay(target)
      return
    }
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return <>{display}</>
}
