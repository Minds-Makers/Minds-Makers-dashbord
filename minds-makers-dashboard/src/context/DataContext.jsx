import { createContext, useContext, useState, useEffect } from 'react'
import initialData from '../data/data.json'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { notify } from '../lib/notify'

const DataCtx = createContext()
const SECTIONS = ['site', 'home', 'services', 'about', 'work', 'contact']

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

  const update = (newData) => setData(newData)

  const saveSection = async (sectionId, sectionData) => {
    const newData = { ...data, [sectionId]: sectionData }
    setData(newData)
    if (!isSupabaseConfigured) return { ok: false, error: 'Database not connected.' }
    try {
      const { error } = await supabase.from('site_content').upsert({ id: sectionId, content: sectionData, updated_at: new Date().toISOString() })
      if (error) throw error
      // ── إيميل تنبيه التعديل ──
      const user = JSON.parse(sessionStorage.getItem('mm_user') || '{}')
      notify('content_edit', { section: sectionId, editor: user.name || user.email || 'Unknown' })
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
