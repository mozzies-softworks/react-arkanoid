import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, type Paddle, type Ball, type Brick, type Vector } from './types';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_Y_OFFSET,
  BALL_RADIUS,
  INITIAL_BALL_SPEED,
  BRICK_ROWS,
  BRICK_COLS,
  BRICK_WIDTH,
  BRICK_HEIGHT,
  BRICK_GAP,
  BRICK_OFFSET_TOP,
  BRICK_OFFSET_LEFT,
  BRICK_COLORS,
  INITIAL_LIVES,
} from './constants';

const createBricks = (): Brick[] => {
  const bricks: Brick[] = [];
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      bricks.push({
        pos: {
          x: BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_GAP),
          y: BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        },
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        hp: 1,
        color: BRICK_COLORS[row % BRICK_COLORS.length],
      });
    }
  }
  return bricks;
};

const App: React.FC = () => {
  const [paddle, setPaddle] = useState<Paddle>({
    pos: { x: (GAME_WIDTH - PADDLE_WIDTH) / 2, y: GAME_HEIGHT - PADDLE_HEIGHT - PADDLE_Y_OFFSET },
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
  });
  const [ball, setBall] = useState<Ball>({
    pos: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - PADDLE_HEIGHT - PADDLE_Y_OFFSET - BALL_RADIUS },
    radius: BALL_RADIUS,
    velocity: { x: 0, y: 0 },
  });
  // Fix: Use lazy initialization for the bricks state by passing the function reference.
  const [bricks, setBricks] = useState<Brick[]>(createBricks);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [gameState, setGameState] = useState<GameState>(GameState.Menu);

  // Fix: Initialize useRef with null, as it expects an initial value.
  const gameLoopRef = useRef<number | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const resetBallAndPaddle = useCallback(() => {
    const newPaddlePos = { x: (GAME_WIDTH - PADDLE_WIDTH) / 2, y: GAME_HEIGHT - PADDLE_HEIGHT - PADDLE_Y_OFFSET };
    setPaddle(p => ({...p, pos: newPaddlePos}));
    setBall({
        pos: { x: newPaddlePos.x + PADDLE_WIDTH / 2, y: newPaddlePos.y - BALL_RADIUS },
        radius: BALL_RADIUS,
        velocity: { x: 0, y: 0 },
    });
  }, []);

  const startGame = () => {
    if (gameState === GameState.Menu || gameState === GameState.GameOver || gameState === GameState.Win) {
      setScore(0);
      setLives(INITIAL_LIVES);
      setBricks(createBricks());
      resetBallAndPaddle();
      setGameState(GameState.Playing);
      // Give the ball an initial velocity
      setBall(b => ({...b, velocity: { x: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1), y: -INITIAL_BALL_SPEED }}));
    }
  };

  const gameLoop = useCallback(() => {
    if (gameState !== GameState.Playing) return;

    setBall(prevBall => {
      let newPos = { x: prevBall.pos.x + prevBall.velocity.x, y: prevBall.pos.y + prevBall.velocity.y };
      let newVel = { ...prevBall.velocity };
      
      // Wall collision
      if (newPos.x <= prevBall.radius || newPos.x >= GAME_WIDTH - prevBall.radius) {
        newVel.x = -newVel.x;
      }
      if (newPos.y <= prevBall.radius) {
        newVel.y = -newVel.y;
      }

      // Paddle collision
      if (
        newPos.y + prevBall.radius >= paddle.pos.y &&
        newPos.y - prevBall.radius <= paddle.pos.y + paddle.height &&
        newPos.x + prevBall.radius >= paddle.pos.x &&
        newPos.x - prevBall.radius <= paddle.pos.x + paddle.width
      ) {
        newVel.y = -Math.abs(newVel.y); // Ensure it always bounces up
        // Change ball angle based on where it hits the paddle
        const hitPoint = (newPos.x - (paddle.pos.x + paddle.width / 2)) / (paddle.width / 2);
        newVel.x = hitPoint * INITIAL_BALL_SPEED; 
      }

      // Brick collision
      let wasBrickHit = false;
      const remainingBricks = bricks.filter(brick => {
          if (
            newPos.x + prevBall.radius > brick.pos.x &&
            newPos.x - prevBall.radius < brick.pos.x + brick.width &&
            newPos.y + prevBall.radius > brick.pos.y &&
            newPos.y - prevBall.radius < brick.pos.y + brick.height
          ) {
            wasBrickHit = true;
            setScore(s => s + 10);
            return false; // Remove brick
          }
          return true;
      });
      
      if (wasBrickHit) {
        newVel.y = -newVel.y;
        setBricks(remainingBricks);
        if (remainingBricks.length === 0) {
            setGameState(GameState.Win);
        }
      }
      
      // Bottom wall collision (lose life)
      if (newPos.y >= GAME_HEIGHT - prevBall.radius) {
        setLives(l => l - 1);
        if (lives - 1 <= 0) {
          setGameState(GameState.GameOver);
        } else {
          resetBallAndPaddle();
          setGameState(GameState.Paused); // pause briefly
          setTimeout(() => {
            setGameState(GameState.Playing);
            setBall(b => ({...b, velocity: { x: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1), y: -INITIAL_BALL_SPEED }}))
          }, 1000);
        }
      }

      return { ...prevBall, pos: newPos, velocity: newVel };
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, paddle.pos.x, paddle.pos.y, paddle.width, paddle.height, lives, resetBallAndPaddle, bricks]);

  useEffect(() => {
    if (gameState === GameState.Playing) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!gameAreaRef.current || gameState !== GameState.Playing) return;
        const gameAreaRect = gameAreaRef.current.getBoundingClientRect();
        const newPaddleX = e.clientX - gameAreaRect.left - paddle.width / 2;
        setPaddle(p => ({
            ...p,
            pos: {
                ...p.pos,
                x: Math.max(0, Math.min(newPaddleX, GAME_WIDTH - paddle.width))
            }
        }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [paddle.width, gameState]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 font-mono">
      <h1 className="text-4xl font-bold text-cyan-400 mb-4 tracking-widest">REACT ARKANOID</h1>
      <div
        ref={gameAreaRef}
        className="relative bg-black border-4 border-cyan-400 shadow-lg shadow-cyan-400/50"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* Game UI */}
        <div className="absolute top-2 left-4 text-white text-2xl">Score: {score}</div>
        <div className="absolute top-2 right-4 text-white text-2xl">Lives: {lives}</div>

        {/* Game Objects */}
        {bricks.map((brick, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: brick.pos.x,
              top: brick.pos.y,
              width: brick.width,
              height: brick.height,
              backgroundColor: brick.color,
              boxShadow: `0 0 5px ${brick.color}`,
            }}
          />
        ))}

        <div
          className="absolute rounded-md bg-cyan-400"
          style={{
            left: paddle.pos.x,
            top: paddle.pos.y,
            width: paddle.width,
            height: paddle.height,
            boxShadow: '0 0 10px #22d3ee, 0 0 20px #22d3ee',
          }}
        />

        <div
          className="absolute rounded-full bg-white"
          style={{
            left: ball.pos.x - ball.radius,
            top: ball.pos.y - ball.radius,
            width: ball.radius * 2,
            height: ball.radius * 2,
             boxShadow: '0 0 10px white, 0 0 20px white',
          }}
        />

        {/* Game State Overlays */}
        {(gameState === GameState.Menu || gameState === GameState.GameOver || gameState === GameState.Win) && (
          <div 
            className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center cursor-pointer"
            onClick={startGame}
          >
            <h2 className="text-5xl font-bold text-white mb-4 animate-pulse">
              {gameState === GameState.Menu && 'CLICK TO PLAY'}
              {gameState === GameState.GameOver && 'GAME OVER'}
              {gameState === GameState.Win && 'YOU WIN!'}
            </h2>
            <p className="text-2xl text-cyan-400">
              {gameState !== GameState.Menu && `Final Score: ${score}`}
            </p>
             {gameState !== GameState.Menu && <p className="text-xl text-white mt-4">Click to Play Again</p>}
          </div>
        )}
        {gameState === GameState.Paused && (
             <div 
             className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center"
           >
                <p className="text-4xl text-white">Get Ready...</p>
            </div>
        )}
      </div>
      <div className="mt-4 text-gray-400">Move your mouse to control the paddle.</div>
    </div>
  );
};

export default App;
