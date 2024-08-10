import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import { Vector3 } from 'three';

const Player = ({ position, health, onShoot }) => {
  const ref = useRef();
  const { camera } = useThree();
  
  useFrame(() => {
    if (ref.current) {
      camera.position.copy(ref.current.position);
    }
  });

  useEffect(() => {
    const handleShoot = (event) => {
      if (event.key === ' ') {
        onShoot();
      }
    };
    window.addEventListener('keydown', handleShoot);
    return () => window.removeEventListener('keydown', handleShoot);
  }, [onShoot]);

  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[1, 2, 1]} />
      <meshStandardMaterial color="red" opacity={0.5} transparent />
    </mesh>
  );
};

const Enemy = ({ position, onHit }) => {
  const ref = useRef();

  useFrame(() => {
    if (Math.random() < 0.01) {
      onHit();
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[1, 2, 1]} />
      <meshStandardMaterial color="green" />
    </mesh>
  );
};

const Bullet = ({ position, direction }) => {
  const ref = useRef();

  useFrame(() => {
    if (ref.current) {
      ref.current.position.add(direction.multiplyScalar(0.5));
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshStandardMaterial color="yellow" />
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

const HUD = ({ health }) => {
  return (
    <Text
      position={[-0.5, 0.4, -1]}
      color="white"
      fontSize={0.1}
      anchorX="left"
      anchorY="middle"
    >
      Health: {health}
    </Text>
  );
};

const Game = () => {
  const [playerPosition, setPlayerPosition] = useState([0, 0, 10]);
  const [health, setHealth] = useState(100);
  const [bullets, setBullets] = useState([]);
  const [enemies, setEnemies] = useState([
    { id: 1, position: [5, 0, 0] },
    { id: 2, position: [-5, 0, -5] },
    { id: 3, position: [0, 0, -10] },
  ]);

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

  const handleShoot = () => {
    const direction = new Vector3(0, 0, -1);
    setBullets([...bullets, { position: [...playerPosition], direction }]);
  };

  const handlePlayerHit = () => {
    setHealth((prevHealth) => Math.max(0, prevHealth - 10));
  };

  useFrame(() => {
    setBullets((prevBullets) =>
      prevBullets.filter((bullet) => {
        const bulletPos = new Vector3(...bullet.position);
        return bulletPos.length() < 50;
      })
    );

    setEnemies((prevEnemies) =>
      prevEnemies.filter((enemy) => {
        const enemyPos = new Vector3(...enemy.position);
        const playerPos = new Vector3(...playerPosition);
        return enemyPos.distanceTo(playerPos) > 1;
      })
    );
  });

  return (
    <div className="w-full h-screen" tabIndex={0} onKeyDown={handleKeyDown}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <PerspectiveCamera makeDefault position={[0, 2, 10]} />
        <Player position={playerPosition} health={health} onShoot={handleShoot} />
        <Floor />
        {enemies.map((enemy) => (
          <Enemy key={enemy.id} position={enemy.position} onHit={handlePlayerHit} />
        ))}
        {bullets.map((bullet, index) => (
          <Bullet key={index} position={bullet.position} direction={bullet.direction} />
        ))}
        <Obstacle position={[5, 1, 0]} />
        <Obstacle position={[-5, 1, -5]} />
        <Obstacle position={[0, 1, -10]} />
        <HUD health={health} />
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default Game;