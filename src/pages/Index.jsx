import React from 'react';
import Game from '../components/Game';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold">Doom-like 3D Game</h1>
      </header>
      <main className="p-4">
        <Game />
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>Use W, A, S, D keys to move. Click and drag to look around.</p>
      </footer>
    </div>
  );
};

export default Index;