import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import BoardList from './components/boards/BoardList';
import './App.css';

function AppContent() {
    const [authMode, setAuthMode] = useState('login');
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <BoardList />;
    }

    return (
        <div className="App">
            {authMode === 'login' ? (
                <Login onSwitchToRegister={() => setAuthMode('register')} />
            ) : (
                <Register onSwitchToLogin={() => setAuthMode('login')} />
            )}
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;