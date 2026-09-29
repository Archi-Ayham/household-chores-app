اimport { useEffect, useRef, useState } from 'react'
import CircleWheel from './components/CircleWheel'
import PersonSpot from './components/PersonSpot'
import { isSupabaseConfigured, supabase } from './supabase'
import type { HouseholdState, Person } from './types'
import { TASKS } from './types'

type Tab = 'cleaning' | 'dishwasher'

const FALLBACK_PEOPLE: Person[] = [1, 2, 3, 4].map((id) => ({
  id,
  name: `Person ${id}`
}))

const PERSON_POSITIONS = ['top', 'right', 'bottom', 'left'] as const

function taskLabel(taskId: number) {
  return TASKS.find((task) => task.id === taskId)?.label ?? 'Task'
}

function LoadingState() {
  return (
    <div className="flex min-h-[65svh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
    </div>
  )
}

function ConfigState() {
  return (
    <div className="mx-auto flex min-h-[65svh] max-w-sm items-center justify-center px-6 text-center">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Supabase not configured</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment, then restart the app.
        </p>
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto flex min-h-[65svh] max-w-sm items-center justify-center px-6 text-center">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Could not load chores</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>('cleaning')
  const [people, setPeople] = useState<Person[]>(FALLBACK_PEOPLE)
  const [state, setState] = useState<HouseholdState | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [pendingPersonId, setPendingPersonId] = useState<number | null>(null)
  const [dishwasherPending, setDishwasherPending] = useState(false)
  const [dishwasherRotation, setDishwasherRotation] = useState(0)
  const previousDishwasherPositionRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let active = true

  const load = async () => {
  setLoading(true)
  setActionError('')

  const peopleResult = await supabase
    .from('people')
    .select('id, name')
    .order('id')

  const stateResult = await (supabase as any)
    .from('household_state')
    .select('*')
    .eq('id', 1)
    .single()

  if (!active) return

  if (peopleResult.error) {
    setActionError(peopleResult.error.message)
  } else if (peopleResult.data && peopleResult.data.length === 4) {
    setPeople(peopleResult.data)
  }

  if (stateResult.error) {
    setActionError(stateResult.error.message)
  } else if (stateResult.data) {
    setState(stateResult.data as HouseholdState)
  }

  setLoading(false)
}

    void load()

    const channel = supabase
      .channel('household-state')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'household_state', filter: 'id=eq.1' },
        (payload) => {
          if (!active) return
          const incoming = payload.new as HouseholdState
          setState((current) => (!current || incoming.version >= current.version ? incoming : current))
        }
      )
      .subscribe()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (!state) return

    const currentPosition = state.dishwasher_position
    if (previousDishwasherPositionRef.current === null) {
      setDishwasherRotation(-(currentPosition - 1) * 90)
      previousDishwasherPositionRef.current = currentPosition
      return
    }

    const previousPosition = previousDishwasherPositionRef.current
    if (previousPosition === currentPosition) return

    const forwardSteps = (currentPosition - previousPosition + 4) % 4
    const steps = Math.max(1, Math.min(forwardSteps, 3))
    setDishwasherRotation((rotation) => rotation - steps * 90)
    previousDishwasherPositionRef.current = currentPosition
  }, [state?.dishwasher_position])

  

  const completeCleaning = async (personId: number) => {
    if (!state || pendingPersonId !== null) return

    setActionError('')
    setPendingPersonId(personId)
const { data, error } = await supabase.rpc(
  'complete_cleaning' as never,
  {
    p_person_id: personId,
    p_expected_round: state.cleaning_round
  } as never
)

    setPendingPersonId(null)

    if (error) {
      setActionError(error.message)
      return
    }

    if (data) {
      setState(data)
    }
  }

  const completeDishwasher = async () => {
    if (!state || dishwasherPending) return

    setActionError('')
    setDishwasherPending(true)

  const { data, error } = await supabase.rpc(
  'complete_dishwasher' as never,
  {
    p_expected_position: state.dishwasher_position
  } as never
)

    setDishwasherPending(false)

    if (error) {
      setActionError(error.message)
      return
    }

    if (data) {
      setState(data)
    }
  }

  if (!isSupabaseConfigured) return <ConfigState />
  if (loading) return <LoadingState />
  if (!state) return <ErrorState message={actionError || 'Check the Supabase project and try again.'} />
const assignments = state.cleaning_assignments
  const currentDishwasherPerson = people.find((person) => person.id === state.dishwasher_position) ?? people[0]

  return (
    <div className="safe-top safe-bottom min-h-[100svh] bg-slate-50 px-4 text-slate-900">
      <main className="mx-auto flex min-h-[100svh] w-full max-w-lg flex-col">
        <header className="pt-2">
          <div className="rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
            <div className="grid grid-cols-2 gap-1" role="tablist" aria-label="Chores">
              {(['cleaning', 'dishwasher'] as Tab[]).map((item) => {
                const active = tab === item
                const label = item === 'cleaning' ? 'Reinigungsplan' : 'Spülmaschine'
                return (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(item)}
                    className={`min-h-12 rounded-xl text-sm font-bold transition ${
                      active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </header>

        {actionError && (
          <button
            type="button"
            onClick={() => setActionError('')}
            className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-left text-xs font-medium text-red-700 ring-1 ring-red-100"
          >
            {actionError}
          </button>
        )}

        {tab === 'cleaning' ? (
          <section className="flex flex-1 flex-col items-center justify-center py-6">
            <div className="mb-5 text-center">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Reinigung</div>
            </div>

            <div className="relative aspect-square w-[min(88vw,25rem)]">
              {people.map((person, index) => (
                <PersonSpot
                  key={person.id}
                  person={person}
                  taskLabel={taskLabel(assignments[index])}
                  completed={state.cleaning_completed[person.id - 1] ?? false}
                  onDone={() => void completeCleaning(person.id)}
                  disabled={pendingPersonId !== null || Boolean(state.cleaning_completed[person.id - 1])}
                  position={PERSON_POSITIONS[index]}
                />
              ))}

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <CircleWheel
                  items={TASKS.map((task) => ({ id: task.id, label: task.label }))}
                  rotation={(state.cleaning_round - 1) * 90}
                  center={null}
                />
              </div>
            </div>
          </section>
        ) : (
          <section className="flex flex-1 flex-col items-center justify-center py-6">
            <div className="flex flex-col items-center text-center">
  <div className="text-2xl font-black text-slate-900">
    Spülmaschine ausräumen
  </div>

  <div className="mt-1 text-sm font-medium text-slate-500">
    {currentDishwasherPerson.name} ist dran
  </div>

  {/* مثلث يشير إلى الشخص الذي عليه الدور */}
  <div
    className="mt-3 h-0 w-0 border-l-[9px] border-r-[9px] border-t-[14px] border-l-transparent border-r-transparent border-t-slate-900"
    aria-hidden="true"
  />
</div>

<div className="mt-5">
              <CircleWheel
                items={people.map((person) => ({ id: person.id, label: person.name }))}
                rotation={dishwasherRotation}
                accent="sky"
                center={null}
              />
            </div>

            <button
              type="button"
              onClick={() => void completeDishwasher()}
              disabled={dishwasherPending}
              className="mt-10 min-h-14 w-full max-w-xs rounded-2xl bg-slate-900 px-6 text-base font-black text-white shadow-lg shadow-slate-900/10 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Erledigt ✓
            </button>
          </section>
        )}
      </main>
    </div>
  )
}
