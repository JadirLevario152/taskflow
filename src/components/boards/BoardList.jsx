import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const BoardList = () => {
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [newBoard, setNewBoard] = useState({ name: '', description: '' });
    
    const { logout } = useAuth();

    useEffect(() => {
        fetchBoards();
    }, []);

    const fetchBoards = async () => {
        try {
            const response = await API.get('/boards');
            setBoards(response.data.boards);
        } catch (error) {
            setError('Error al cargar tableros');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBoard = async (e) => {
        e.preventDefault();
        try {
            await API.post('/boards', newBoard);
            setNewBoard({ name: '', description: '' });
            setShowForm(false);
            fetchBoards();
        } catch (error) {
            setError('Error al crear tablero');
        }
    };

    const handleDeleteBoard = async (id) => {
        try {
            await API.delete(`/boards/${id}`);
            fetchBoards();
        } catch (error) {
            setError('Error al eliminar tablero');
        }
    };

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="boards-container">
            <div className="header">
                <h1>Mis Tableros</h1>
                <button onClick={logout} className="logout-btn">Cerrar Sesión</button>
            </div>
            
            {error && <div className="error">{error}</div>}
            
            <button 
                onClick={() => setShowForm(!showForm)} 
                className="create-btn"
            >
                {showForm ? 'Cancelar' : '+ Nuevo Tablero'}
            </button>

            {showForm && (
                <form onSubmit={handleCreateBoard} className="board-form">
                    <input
                        type="text"
                        placeholder="Nombre del tablero"
                        value={newBoard.name}
                        onChange={(e) => setNewBoard({...newBoard, name: e.target.value})}
                        required
                    />
                    <textarea
                        placeholder="Descripción (opcional)"
                        value={newBoard.description}
                        onChange={(e) => setNewBoard({...newBoard, description: e.target.value})}
                    />
                    <button type="submit">Crear Tablero</button>
                </form>
            )}

            <div className="boards-grid">
                {boards.map(board => (
                    <div key={board.id} className="board-card">
                        <h3>{board.name}</h3>
                        <p>{board.description}</p>
                        <small>Creado: {new Date(board.created_at).toLocaleDateString()}</small>
                        <button 
                            onClick={() => handleDeleteBoard(board.id)}
                            className="delete-btn"
                        >
                            Eliminar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BoardList;