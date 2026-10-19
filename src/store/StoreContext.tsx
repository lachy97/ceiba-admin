import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import { createDemoData } from '../data/seed'
import type { AppData, Customer } from '../data/types'
import { loadData, saveData } from './persist'
import { reducer, type Action } from './reducer'

interface StoreValue {
  data: AppData
  dispatch: Dispatch<Action>
  customersById: Map<string, Customer>
  resetDemo: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, () => loadData())

  useEffect(() => saveData(data), [data])

  const value = useMemo<StoreValue>(
    () => ({
      data,
      dispatch,
      customersById: new Map(data.customers.map((c) => [c.id, c])),
      resetDemo: () => dispatch({ type: 'data/replace', data: createDemoData() }),
    }),
    [data],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>')
  return ctx
}
