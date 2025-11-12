
export interface Vector {
  x: number;
  y: number;
}

export interface Paddle {
  pos: Vector;
  width: number;
  height: number;
}

export interface Ball {
  pos: Vector;
  radius: number;
  velocity: Vector;
}

export interface Brick {
  pos: Vector;
  width: number;
  height: number;
  hp: number;
  color: string;
}

export enum GameState {
  Menu = 'menu',
  Playing = 'playing',
  Paused = 'paused',
  GameOver = 'gameOver',
  Win = 'win',
}
