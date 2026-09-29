export type Person = {
  id: number
  name: string
}

export type HouseholdState = {
  id: number
  cleaning_round: number
  cleaning_assignments: number[]
  cleaning_completed: boolean[]
  dishwasher_position: number
  version: number
}

export type Database = {
  public: {
    Tables: {
      people: {
        Row: Person
        Insert: { id: number; name: string }
        Update: { id?: number; name?: string }
      }
      household_state: {
        Row: HouseholdState
        Insert: {
          id?: number
          cleaning_round?: number
          cleaning_assignments?: number[]
          cleaning_completed?: boolean[]
          dishwasher_position?: number
          version?: number
        }
        Update: {
          id?: number
          cleaning_round?: number
          cleaning_assignments?: number[]
          cleaning_completed?: boolean[]
          dishwasher_position?: number
          version?: number
        }
      }
    }
    Functions: {
      complete_cleaning: {
        Args: { p_person_id: number; p_expected_round: number }
        Returns: HouseholdState
      }
      complete_dishwasher: {
        Args: { p_expected_position: number }
        Returns: HouseholdState
      }
    }
  }
}

export const TASKS = [
  { id: 1, label: 'Badezimmer' },
  { id: 2, label: 'Küche' },
  { id: 3, label: 'Wohnzimmer' },
  { id: 4, label: 'Pause' }
] as const
