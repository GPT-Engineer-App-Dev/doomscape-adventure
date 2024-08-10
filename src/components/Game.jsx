import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, OrbitControls, PerspectiveCamera, Text, useTexture } from '@react-three/drei';
import { Vector3, Raycaster } from 'three';

const WEAPONS = {
  PISTOL: { name: 'Pistol', damage: 10, ammo: 50, fireRate: 5 },
  SHOTGUN: { name: 'Shotgun', damage: 25, ammo: 20, fireRate: 2 },
};

const Player = ({ position, health, weapon, onShoot }) => {
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

const Enemy = ({ position, onHit, onDie }) => {
  const ref = useRef();
  const [health, setHealth] = useState(100);

  useFrame(() => {
    if (Math.random() < 0.005) {
      onHit();
    }
  });

  const hit = (damage) => {
    setHealth((prev) => {
      const newHealth = prev - damage;
      if (newHealth <= 0) {
        onDie();
      }
      return newHealth;
    });
  };

  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[1, 2, 1]} />
      <meshStandardMaterial color="green" />
    </mesh>
  );
};

const Bullet = ({ position, direction, onHit }) => {
  const ref = useRef();

  useFrame(() => {
    if (ref.current) {
      ref.current.position.add(direction.multiplyScalar(0.5));
      if (ref.current.position.length() > 50) {
        onHit();
      }
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshStandardMaterial color="yellow" />
    </mesh>
  );
};

const Obstacle = ({ position, size }) => {
  return (
    <Box position={position} args={size}>
      <meshStandardMaterial color="gray" />
    </Box>
  );
};

const Floor = () => {
  const texture = useTexture('/placeholder.svg');
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
};

const HUD = ({ health, weapon, ammo }) => {
  return (
    <>
      <Text position={[-0.8, 0.4, -1]} color="white" fontSize={0.05} anchorX="left" anchorY="middle">
        Health: {health}
      </Text>
      <Text position={[-0.8, 0.3, -1]} color="white" fontSize={0.05} anchorX="left" anchorY="middle">
        Weapon: {weapon.name}
      </Text>
      <Text position={[-0.8, 0.2, -1]} color="white" fontSize={0.05} anchorX="left" anchorY="middle">
        Ammo: {ammo}
      </Text>
    </>
  );
};

const Minimap = ({ playerPosition, enemies, obstacles }) => {
  const scale = 0.02;
  return (
    <group position={[0.7, 0.4, -1]} scale={[scale, scale, 1]}>
      <mesh>
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial color="black" opacity={0.5} transparent />
      </mesh>
      <mesh position={[playerPosition[0], playerPosition[2], 0]}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color="blue" />
      </mesh>
      {enemies.map((enemy, index) => (
        <mesh key={index} position={[enemy.position[0], enemy.position[2], 0]}>
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial color="red" />
        </mesh>
      ))}
      {obstacles.map((obstacle, index) => (
        <mesh key={index} position={[obstacle.position[0], obstacle.position[2], 0]}>
          <boxGeometry args={[obstacle.size[0], obstacle.size[2], 1]} />
          <meshBasicMaterial color="gray" />
        </mesh>
      ))}
    </group>
  );
};

const GameScene = () => {
  const [playerPosition, setPlayerPosition] = useState([0, 0, 10]);
  const [health, setHealth] = useState(100);
  const [weapon, setWeapon] = useState(WEAPONS.PISTOL);
  const [ammo, setAmmo] = useState(WEAPONS.PISTOL.ammo);
  const [bullets, setBullets] = useState([]);
  const [enemies, setEnemies] = useState([
    { id: 1, position: [5, 0, 0] },
    { id: 2, position: [-5, 0, -5] },
    { id: 3, position: [0, 0, -10] },
  ]);
  const [gameOver, setGameOver] = useState(false);

  const obstacles = useMemo(() => [
    { position: [5, 1, 0], size: [2, 4, 2] },
    { position: [-5, 1, -5], size: [2, 4, 2] },
    { position: [0, 1, -10], size: [2, 4, 2] },
    { position: [10, 1, -10], size: [20, 4, 1] },
    { position: [-10, 1, -10], size: [20, 4, 1] },
    { position: [10, 1, 10], size: [20, 4, 1] },
    { position: [-10, 1, 10], size: [20, 4, 1] },
  ], []);

  const raycaster = useMemo(() => new Raycaster(), []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (gameOver) return;

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
        case '1':
          setWeapon(WEAPONS.PISTOL);
          setAmmo(WEAPONS.PISTOL.ammo);
          break;
        case '2':
          setWeapon(WEAPONS.SHOTGUN);
          setAmmo(WEAPONS.SHOTGUN.ammo);
          break;
        case 'r':
          if (gameOver) restartGame();
          break;
      }

      // Simple collision detection
      const playerVector = new Vector3(newPosition[0], newPosition[1], newPosition[2]);
      let collision = false;

      for (const obstacle of obstacles) {
        const obstacleVector = new Vector3(...obstacle.position);
        const distance = playerVector.distanceTo(obstacleVector);
        if (distance < 2) {
          collision = true;
          break;
        }
      }

      if (!collision) {
        setPlayerPosition(newPosition);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPosition, gameOver, obstacles]);

  const handleShoot = () => {
    if (gameOver || ammo <= 0) return;

    const direction = new Vector3(0, 0, -1);
    setBullets(prev => [...prev, { position: [...playerPosition], direction }]);
    setAmmo(prev => prev - 1);
  };

  const handlePlayerHit = () => {
    setHealth(prev => {
      const newHealth = Math.max(0, prev - 10);
      if (newHealth === 0) {
        setGameOver(true);
      }
      return newHealth;
    });
  };

  const handleEnemyDie = (id) => {
    setEnemies(prev => prev.filter(enemy => enemy.id !== id));
  };

  const restartGame = () => {
    setPlayerPosition([0, 0, 10]);
    setHealth(100);
    setWeapon(WEAPONS.PISTOL);
    setAmmo(WEAPONS.PISTOL.ammo);
    setBullets([]);
    setEnemies([
      { id: 1, position: [5, 0, 0] },
      { id: 2, position: [-5, 0, -5] },
      { id: 3, position: [0, 0, -10] },
    ]);
    setGameOver(false);
  };

  useFrame(() => {
    setBullets(prev => prev.filter(bullet => {
      const bulletVector = new Vector3(...bullet.position);
      for (const enemy of enemies) {
        const enemyVector = new Vector3(...enemy.position);
        if (bulletVector.distanceTo(enemyVector) < 1) {
          handleEnemyDie(enemy.id);
          return false;
        }
      }
      return bulletVector.length() < 50;
    }));

    if (enemies.length === 0) {
      setGameOver(true);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <PerspectiveCamera makeDefault position={[0, 2, 10]} />
      <Player position={playerPosition} health={health} weapon={weapon} onShoot={handleShoot} />
      <Floor />
      {enemies.map((enemy) => (
        <Enemy key={enemy.id} position={enemy.position} onHit={handlePlayerHit} onDie={() => handleEnemyDie(enemy.id)} />
      ))}
      {bullets.map((bullet, index) => (
        <Bullet key={index} position={bullet.position} direction={bullet.direction} onHit={() => {}} />
      ))}
      {obstacles.map((obstacle, index) => (
        <Obstacle key={index} position={obstacle.position} size={obstacle.size} />
      ))}
      <HUD health={health} weapon={weapon} ammo={ammo} />
      <Minimap playerPosition={playerPosition} enemies={enemies} obstacles={obstacles} />
      <OrbitControls />
      {gameOver && (
        <Text position={[0, 0, -5]} color="white" fontSize={0.5} anchorX="center" anchorY="middle">
          {enemies.length === 0 ? "You Win!" : "Game Over"}
          {"\n"}
          Press 'R' to restart
        </Text>
      )}
    </>
  );
};

const Game = () => {
  return (
    <div className="w-full h-screen">
      <Canvas>
        <GameScene />
      </Canvas>
    </div>
  );
};

export default Game;