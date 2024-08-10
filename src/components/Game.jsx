import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Vector3 } from 'three';

const Player = ({ position }) => {
  const ref = useRef();
  const { camera } = useThree();
  
  useFrame(() => {
    if (ref.current) {
      camera.position.copy(ref.current.position);
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[1, 2, 1]} />
      <meshStandardMaterial color="red" opacity={0.5} transparent />
    </mesh>
  );
};

const Obstacle = ({ position }) => {
  return (
    <Box position={position} args={[2, 4, 2]}>
      <meshStandardMaterial color="gray" />
    </Box>
  );
};

const Floor = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#444" />
    </mesh>
  );
};

const Game = () => {
  const [playerPosition, setPlayerPosition] = useState([0, 0, 10]);

  const handleKeyDown = (event) => {
    const speed = 0.5;
    const newPosition = [...playerPosition];

    switch (event.key) {
      case 'w':
        newPosition[2] -= speed;
        break;
      case 's':
        newPosition[2] += speed;
        break;
      case 'a':
        newPosition[0] -= speed;
        break;
      case 'd':
        newPosition[0] += speed;
        break;
    }

    setPlayerPosition(newPosition);
  };

  return (
    <div className="w-full h-screen" tabIndex={0} onKeyDown={handleKeyDown}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <PerspectiveCamera makeDefault position={[0, 2, 10]} />
        <Player position={playerPosition} />
        <Floor />
        <Obstacle position={[5, 1, 0]} />
        <Obstacle position={[-5, 1, -5]} />
        <Obstacle position={[0, 1, -10]} />
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default Game;