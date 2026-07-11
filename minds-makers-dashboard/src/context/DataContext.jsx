import { createContext, useContext, useState, useEffect } from 'react'
import initialData from '../data/data.json'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const DataCtx = createContext()
const SECTIONS = ['site', 'home', 'services', 'about', 'work']

export function DataProvider({ children }) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return }
    let cancelled = false
    async function fetchAll() {
      try {
        const { data: rows, error } = await supabase.from('site_content').select('id, content')
        if (error) throw error
        if (cancelled) return
        const merged = { ...initialData }
        for (const row of rows || []) {
          if (SECTIONS.includes(row.id)) merged[row.id] = row.content
        }
        setData(merged)
      } catch (e) {
        setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchAll()
    return () => { cancelled = true }
  }, [])

  // Local-only update (instant UI feedback while editing, before Save)
  const update = (newData) => setData(newData)

  // Persist a single section to Supabase — this is what actually
  // makes the change live for every visitor on the public site.
  const saveSection = async (sectionId, sectionData) => {
    const newData = { ...data, [sectionId]: sectionData }
    setData(newData)
    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Database not connected yet. Paste your Supabase credentials in src/lib/supabaseClient.js' }
    }
    try {
      const { error } = await supabase
        .from('site_content')
        .upsert({ id: sectionId, content: sectionData, updated_at: new Date().toISOString() })
      if (error) throw error
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }

  return (
    <DataCtx.Provider value={{ data, update, saveSection, loading, error, isSupabaseConfigured }}>
      {children}
    </DataCtx.Provider>
  )
}

export const useData = () => useContext(DataCtx)
