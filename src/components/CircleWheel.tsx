import type { CSSProperties, ReactNode } from 'react'

type WheelItem = {
  id: number
  label: string
}

type CircleWheelProps = {
  items: WheelItem[]
  rotation: number
  accent?: 'slate' | 'emerald' | 'sky'
  center: ReactNode
}

/* =========================================================
   WHEEL SETTINGS
   ========================================================= */

// حجم العجلة
const WHEEL_SIZE = 'clamp(10rem, 42vw, 12rem)'

// حجم القرص الداخلي
const CENTER_SIZE = 'size-10'

// حجم صناديق أسماء الغرف
const LABEL_SIZE = 'min-h-12 w-max max-w-32'

// المسافة الشعاعية بين الصناديق ومركز العجلة
//
// كلما زادت القيمة → تبتعد الصناديق عن المركز
//
// هذه القيمة واحدة لجميع الاتجاهات، لذلك عندما تدور
// العجلة تبقى المسافة نفسها.
const LABEL_DISTANCE = 2

// سماكة إطار العجلة
const WHEEL_BORDER = 'border-[10px]'

// سرعة دوران العجلة
const ROTATION_DURATION = 'duration-700'

/* ========================================================= */

const positions = ['top', 'right', 'bottom', 'left'] as const

export default function CircleWheel({
  items,
  rotation,
  accent = 'slate',
  center
}: CircleWheelProps) {
  const ringClass = {
    slate: 'border-slate-300 bg-white',
    emerald: 'border-emerald-200 bg-emerald-50/70',
    sky: 'border-sky-200 bg-sky-50/70'
  }[accent]

  return (
    <div
      className={`relative ${WHEEL_BORDER} ${ringClass} shrink-0 rounded-full shadow-[0_18px_45px_rgba(15,23,42,0.10)]`}
      style={{
        width: WHEEL_SIZE,
        height: WHEEL_SIZE
      }}
    >
      {/* Rotating layer */}
      <div
        className={`absolute inset-0 ${ROTATION_DURATION} ease-[cubic-bezier(.22,.9,.34,1)]`}
        style={{
          transform: `rotate(${rotation}deg)`
        }}
      >
        {positions.map((position, index) => {
          const item = items[index]

          if (!item) return null

          /*
           * نضع كل صندوق على حافة العجلة ثم نزيحه
           * للخارج في اتجاهه.
           */
          const positionStyle: CSSProperties = {
            top:
              position === 'top'
                ? `${-LABEL_DISTANCE}px`
                : position === 'bottom'
                  ? undefined
                  : '50%',

            bottom:
              position === 'bottom'
                ? `${-LABEL_DISTANCE}px`
                : undefined,

            left:
              position === 'left'
                ? `${-LABEL_DISTANCE}px`
                : position === 'right'
                  ? undefined
                  : '50%',

            right:
              position === 'right'
                ? `${-LABEL_DISTANCE}px`
                : undefined,

            transform:
              position === 'top' || position === 'bottom'
                ? `translateX(-50%) rotate(${-rotation}deg)`
                : `translateY(-50%) rotate(${-rotation}deg)`
          }

          return (
            <div
              key={item.id}
              className={`absolute ${LABEL_SIZE} flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2 text-center text-xs font-semibold leading-tight text-slate-700 shadow-sm sm:text-sm`}
              style={positionStyle}
            >
              {item.label}
            </div>
          )
        })}
      </div>

      {/* Center — does NOT rotate */}
      <div
        className={`absolute left-1/2 top-1/2 flex ${CENTER_SIZE} -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-slate-900 text-center text-[11px] font-semibold tracking-wide text-white shadow-lg`}
      >
        {center}
      </div>
    </div>
  )
}
