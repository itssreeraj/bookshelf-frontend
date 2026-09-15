import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DrawerNav from './components/DrawerNav.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LibraryPage from './pages/LibraryPage.jsx';
import WishlistPage from './pages/WishlistPage.jsx';
import BookDetailPage from './pages/BookDetailPage.jsx';
import AddBookPage from './pages/AddBookPage.jsx';
import AskLibrarianPage from './pages/AskLibrarianPage.jsx';

function AppShell({ children }) {
  return (
    <div className="min-h-screen flex">
      <DrawerNav />
      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell>
                  <LibraryPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <AppShell>
                  <WishlistPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/add"
            element={
              <ProtectedRoute>
                <AppShell>
                  <AddBookPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ask"
            element={
              <ProtectedRoute>
                <AppShell>
                  <AskLibrarianPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/books/:id"
            element={
              <ProtectedRoute>
                <AppShell>
                  <BookDetailPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
