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
        <p>Use W, A, S, D keys to move. Click and drag to look around. Press SPACE to shoot.</p>
        <p>Press 1 for Pistol, 2 for Shotgun. Avoid the green enemies and defeat them all!</p>
        <p>Your health, weapon, and ammo are displayed in the top-left corner. The minimap is in the top-right.</p>
        <p>If you die or win, press 'R' to restart the game.</p>
      </footer>
    </div>
  );
};

export default Index;