import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, OrbitControls, PerspectiveCamera, Text, useTexture } from '@react-three/drei';
import { Vector3, Raycaster } from 'three';

const WEAPONS = {
  PISTOL: { name: 'Pistol', damage: 10, maxAmmo: 50, fireRate: 5 },
  SHOTGUN: { name: 'Shotgun', damage: 25, maxAmmo: 20, fireRate: 2 },
};

const useWeaponSystem = () => {
  const [currentWeapon, setCurrentWeapon] = useState(WEAPONS.PISTOL);
  const [ammo, setAmmo] = useState({ PISTOL: WEAPONS.PISTOL.maxAmmo, SHOTGUN: WEAPONS.SHOTGUN.maxAmmo });
  const [lastFireTime, setLastFireTime] = useState(0);

  const switchWeapon = (weapon) => {
    setCurrentWeapon(weapon);
  };

  const fire = () => {
    const now = Date.now();
    if (now - lastFireTime < 1000 / currentWeapon.fireRate) return false;
    if (ammo[currentWeapon.name] <= 0) return false;

    setAmmo(prev => ({ ...prev, [currentWeapon.name]: prev[currentWeapon.name] - 1 }));
    setLastFireTime(now);
    return true;
  };

  const addAmmo = (weaponName, amount) => {
    setAmmo(prev => ({
      ...prev,
      [weaponName]: Math.min(prev[weaponName] + amount, WEAPONS[weaponName].maxAmmo)
    }));
  };

  return { currentWeapon, ammo, switchWeapon, fire, addAmmo };
};

const POWERUPS = {
  HEALTH: { name: 'Health', effect: 50 },
  AMMO: { name: 'Ammo', effect: 20 },
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

const Enemy = ({ position, onHit, onDie, playerPosition, obstacles }) => {
  const ref = useRef();
  const [health, setHealth] = useState(100);

  useFrame(() => {
    if (ref.current) {
      const direction = new Vector3(...playerPosition).sub(ref.current.position).normalize();
      const newPosition = ref.current.position.clone().add(direction.multiplyScalar(0.03));
      
      // Check for collisions with obstacles
      let collision = false;
      for (const obstacle of obstacles) {
        const obstacleVector = new Vector3(...obstacle.position);
        const distance = newPosition.distanceTo(obstacleVector);
        if (distance < 2) {
          collision = true;
          break;
        }
      }
      
      if (!collision) {
        ref.current.position.copy(newPosition);
      }
      
      if (Math.random() < 0.005) {
        onHit();
      }
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

const useBulletSystem = (camera) => {
  const [bullets, setBullets] = useState([]);

  const fireBullet = () => {
    const bulletDirection = new Vector3();
    camera.getWorldDirection(bulletDirection);
    const bulletPosition = camera.position.clone().add(bulletDirection.multiplyScalar(1));
    setBullets(prev => [...prev, { position: bulletPosition, direction: bulletDirection }]);
  };

  const updateBullets = () => {
    setBullets(prev => prev.filter(bullet => bullet.position.length() <= 50));
  };

  return { bullets, fireBullet, updateBullets };
};

const Powerup = ({ position, type, onCollect }) => {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.05;
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      onCollect();
    }, 30000); // Despawn after 30 seconds

    return () => clearTimeout(timeout);
  }, [onCollect]);

  return (
    <mesh
      ref={ref}
      position={position}
      onClick={onCollect}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color={type === POWERUPS.HEALTH ? "red" : "blue"} emissive={hovered ? "white" : "black"} emissiveIntensity={0.5} />
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

const HUD = ({ health, weapon, ammo, level }) => {
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
      <Text position={[-0.8, 0.1, -1]} color="white" fontSize={0.05} anchorX="left" anchorY="middle">
        Level: {level}
      </Text>
    </>
  );
};

const Minimap = ({ playerPosition, enemies, obstacles, powerups }) => {
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
      {powerups.map((powerup, index) => (
        <mesh key={index} position={[powerup.position[0], powerup.position[2], 0]}>
          <circleGeometry args={[0.5, 32]} />
          <meshBasicMaterial color={powerup.type === POWERUPS.HEALTH ? "green" : "yellow"} />
        </mesh>
      ))}
    </group>
  );
};

const GameScene = ({ level, onLevelComplete }) => {
  const [playerPosition, setPlayerPosition] = useState([0, 0, 10]);
  const [health, setHealth] = useState(100);
  const [enemies, setEnemies] = useState([]);
  const [powerups, setPowerups] = useState([]);
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
  const cameraRef = useRef();
  const { currentWeapon, ammo, switchWeapon, fire, addAmmo } = useWeaponSystem();
  const { bullets, fireBullet, updateBullets } = useBulletSystem(cameraRef.current);

  useFrame(() => {
    updateBullets();
  });

  useEffect(() => {
    // Initialize level
    const enemyCount = Math.max(1, level * 2); // Ensure at least 1 enemy
    const powerupCount = Math.max(1, level); // Ensure at least 1 powerup

    setEnemies(Array(enemyCount).fill().map((_, i) => ({
      id: i,
      position: [Math.random() * 20 - 10, 0, Math.random() * 20 - 10]
    })));
    setPowerups(Array(powerupCount).fill().map((_, i) => ({
      position: [Math.random() * 20 - 10, 0, Math.random() * 20 - 10],
      type: Math.random() > 0.5 ? POWERUPS.HEALTH : POWERUPS.AMMO
    })));
  }, [level]);

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

      // Improved collision detection
      const playerVector = new Vector3(newPosition[0], newPosition[1], newPosition[2]);
      let collision = false;

      for (const obstacle of obstacles) {
        const obstacleMin = new Vector3(
          obstacle.position[0] - obstacle.size[0] / 2,
          obstacle.position[1] - obstacle.size[1] / 2,
          obstacle.position[2] - obstacle.size[2] / 2
        );
        const obstacleMax = new Vector3(
          obstacle.position[0] + obstacle.size[0] / 2,
          obstacle.position[1] + obstacle.size[1] / 2,
          obstacle.position[2] + obstacle.size[2] / 2
        );
        
        if (
          playerVector.x > obstacleMin.x && playerVector.x < obstacleMax.x &&
          playerVector.y > obstacleMin.y && playerVector.y < obstacleMax.y &&
          playerVector.z > obstacleMin.z && playerVector.z < obstacleMax.z
        ) {
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
    if (gameOver) return;

    if (fire()) {
      fireBullet();
      playSound('shoot');
    } else {
      playSound('empty');
    }
  };

  const handlePlayerHit = () => {
    setHealth(prev => {
      const newHealth = Math.max(0, prev - 10);
      if (newHealth === 0) {
        setGameOver(true);
        playSound('gameover');
      } else {
        playSound('hit');
      }
      return newHealth;
    });
  };

  const handleEnemyDie = (id) => {
    setEnemies(prev => prev.filter(enemy => enemy.id !== id));
    playSound('enemyDie');
  };

  const handlePowerupCollect = (index) => {
    const powerup = powerups[index];
    if (powerup.type === POWERUPS.HEALTH) {
      setHealth(prev => Math.min(100, prev + POWERUPS.HEALTH.effect));
    } else {
      addAmmo(currentWeapon.name, POWERUPS.AMMO.effect);
    }
    setPowerups(prev => prev.filter((_, i) => i !== index));
    playSound('powerup');
  };

  const restartGame = () => {
    setPlayerPosition([0, 0, 10]);
    setHealth(100);
    setWeapon(WEAPONS.PISTOL);
    setAmmo(WEAPONS.PISTOL.ammo);
    setBullets([]);
    setGameOver(false);
    onLevelComplete();
  };

  const playSound = (soundName) => {
    // Implement sound playing logic here
    console.log(`Playing sound: ${soundName}`);
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
      onLevelComplete();
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
        <Enemy key={enemy.id} position={enemy.position} onHit={handlePlayerHit} onDie={() => handleEnemyDie(enemy.id)} playerPosition={playerPosition} />
      ))}
      {bullets.map((bullet, index) => (
        <Bullet key={index} position={bullet.position} direction={bullet.direction} onHit={() => {}} />
      ))}
      {obstacles.map((obstacle, index) => (
        <Obstacle key={index} position={obstacle.position} size={obstacle.size} />
      ))}
      {powerups.map((powerup, index) => (
        <Powerup key={index} position={powerup.position} type={powerup.type} onCollect={() => handlePowerupCollect(index)} />
      ))}
      <HUD health={health} weapon={weapon} ammo={ammo} level={level} />
      <Minimap playerPosition={playerPosition} enemies={enemies} obstacles={obstacles} powerups={powerups} />
      <OrbitControls />
      {gameOver && (
        <Text position={[0, 0, -5]} color="white" fontSize={0.5} anchorX="center" anchorY="middle">
          {enemies.length === 0 ? "Level Complete!" : "Game Over"}
          {"\n"}
          Press 'R' to {enemies.length === 0 ? "continue" : "restart"}
        </Text>
      )}
    </>
  );
};

const Game = () => {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'gameOver'
  const [level, setLevel] = useState(1);

  const startGame = () => {
    setGameState('playing');
    setLevel(1);
  };

  const handleLevelComplete = () => {
    setLevel(prev => prev + 1);
  };

  return (
    <div className="w-full h-screen">
      {gameState === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
          <div className="text-white text-center">
            <h1 className="text-4xl mb-4">Dooooom</h1>
            <button
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={startGame}
            >
              Start Game
            </button>
          </div>
        </div>
      )}
      <Canvas>
        <GameScene level={level} onLevelComplete={handleLevelComplete} />
      </Canvas>
    </div>
  );
};

export default Game;