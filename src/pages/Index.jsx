import React from 'react';
import Game from '../components/Game';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold">Dooooom</h1>
      </header>
      <main className="p-4">
        <Game />
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>Use W, A, S, D keys to move. Click and drag to look around. Press SPACE to shoot.</p>
        <p>Press 1 for Pistol, 2 for Shotgun. Collect power-ups and defeat all enemies!</p>
        <p>Your health, weapon, ammo, and current level are displayed in the top-left corner.</p>
        <p>The minimap in the top-right shows enemies (red), power-ups (green/yellow), and obstacles (gray).</p>
        <p>Complete each level to progress. If you die, press 'R' to restart the current level.</p>
      </footer>
    </div>
  );
};

export default Index;