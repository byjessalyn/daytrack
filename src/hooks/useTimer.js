import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer() {
  const [timerState, setTimerState] = useState({
    active: false,
    running: false,
    remaining: 0,
    total: 0,
    blockName: '',
    done: false,
  })
  const intervalRef = useRef(null)

  const startBlock = useCallback((block) => {
    clearInterval(intervalRef.current)
    const total = block.dur * 60
    setTimerState({ active: true, running: false, remaining: total, total, blockName: block.name, done: false })
  }, [])

  const toggle = useCallback(() => {
    setTimerState(prev => {
      if (prev.done) return prev
      return { ...prev, running: !prev.running }
    })
  }, [])

  const reset = useCallback(() => {
    clearInterval(intervalRef.current)
    setTimerState(prev => ({ ...prev, running: false, remaining: prev.total, done: false }))
  }, [])

  const close = useCallback(() => {
    clearInterval(intervalRef.current)
    setTimerState(prev => ({ ...prev, active: false, running: false }))
  }, [])

  const skip = useCallback(() => {
    clearInterval(intervalRef.current)
    setTimerState(prev => ({ ...prev, running: false, remaining: 0, done: true }))
  }, [])

  useEffect(() => {
    if (timerState.running && !timerState.done) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          if (prev.remaining <= 1) {
            clearInterval(intervalRef.current)
            return { ...prev, remaining: 0, running: false, done: true }
          }
          return { ...prev, remaining: prev.remaining - 1 }
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [timerState.running, timerState.done])

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const progress = timerState.total > 0 ? timerState.remaining / timerState.total : 1

  return { timerState, startBlock, toggle, reset, close, skip, formatTime, progress }
}
