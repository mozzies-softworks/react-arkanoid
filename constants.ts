
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const PADDLE_WIDTH = 120;
export const PADDLE_HEIGHT = 20;
export const PADDLE_Y_OFFSET = 30;

export const BALL_RADIUS = 10;
export const INITIAL_BALL_SPEED = 5;

export const BRICK_ROWS = 5;
export const BRICK_COLS = 10;
export const BRICK_HEIGHT = 25;
export const BRICK_GAP = 5;
export const BRICK_OFFSET_TOP = 50;
export const BRICK_OFFSET_LEFT = 30;
export const BRICK_WIDTH = (GAME_WIDTH - 2 * BRICK_OFFSET_LEFT - (BRICK_COLS - 1) * BRICK_GAP) / BRICK_COLS;

export const BRICK_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

export const INITIAL_LIVES = 3;
