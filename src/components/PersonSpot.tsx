import type { Person } from '../types'

type PersonSpotProps = {
  person: Person
  taskLabel: string
  completed: boolean
  onDone: () => void
  disabled: boolean
  position: 'top' | 'right' | 'bottom' | 'left'
}

/* =========================================================
   PERSON SPOT SETTINGS
   ========================================================= */

// المسافة عن مركز عجلة Cleaning
// كلما زادت القيمة المطلقة، ابتعد العنصر أكثر
const PERSON_OFFSET = 20

const PERSON_WIDTH = 'w-[6.5rem] sm:w-28'

const CONTENT_GAP = 'gap-2'

/* ========================================================= */

export default function PersonSpot({
  person,
  taskLabel,
  completed,
  onDone,
  disabled,
  position
}: PersonSpotProps) {
  const positionStyle = {
    top: {
      left: '50%',
      top: `-${PERSON_OFFSET}px`,
      transform: 'translateX(-50%)'
    },
    right: {
      right: `-${PERSON_OFFSET}px`,
      top: '50%',
      transform: 'translateY(-50%)'
    },
    bottom: {
      left: '50%',
      bottom: `-${PERSON_OFFSET}px`,
      transform: 'translateX(-50%)'
    },
    left: {
      left: `-${PERSON_OFFSET}px`,
      top: '50%',
      transform: 'translateY(-50%)'
    }
  }[position]

  return (
    <div
      className={`absolute ${PERSON_WIDTH} flex flex-col items-center ${CONTENT_GAP} text-center`}
      style={positionStyle}
    >
      <div className="text-sm font-bold text-slate-900 sm:text-base">
        {person.name}
      </div>

      <div className="max-w-full text-[11px] font-medium leading-tight text-slate-500">
        {taskLabel}
      </div>

      <button
        type="button"
        onClick={onDone}
        disabled={disabled}
        aria-pressed={completed}
        className={`min-h-11 w-full rounded-xl px-2 text-xs font-bold shadow-sm transition active:scale-[0.98] ${
          completed
            ? 'cursor-default bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
            : 'bg-slate-900 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50'
        }`}
      >
        Erledigt ✓
      </button>
    </div>
  )
}