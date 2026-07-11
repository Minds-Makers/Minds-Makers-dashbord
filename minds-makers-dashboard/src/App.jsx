import { DataProvider } from './context/DataContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function Gate() {
  const { user } = useAuth()
  return user ? <Dashboard /> : <Login />
}

export default function App() {
  return (
    <DataProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </DataProvider>
  )
}
