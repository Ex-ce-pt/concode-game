enum Direction {
    NONE,
    UP,
    DOWN,
    RIGHT,
    LEFT
}

enum GameState {
    NONE,
    PATH_VIEW,
    GAME,
    WON,
    LOST
}

interface Point {
    x: number,
    y: number
}

const GRID_WIDTH = 5;
const GRID_HEIGHT = 5;
const PLAYER_MARGIN = 0.15;

const BG_COLOR = 'rgb(40, 40, 40)';
const GRID_COLOR = 'rgb(200, 200, 200)';
const PLAYER_COLOR = 'rgb(12, 123, 235)'; // totally random
const PATH_COLOR = 'rgba(100, 100, 100, 0.5)';
const FINISH_COLOR = 'rgb(50, 200, 50)';

const ARROW_UP_IMAGE = new Image();
const ARROW_DOWN_IMAGE = new Image();
const ARROW_RIGHT_IMAGE = new Image();
const ARROW_LEFT_IMAGE = new Image();

ARROW_UP_IMAGE.src = './imgs/arrowUp.png';
ARROW_DOWN_IMAGE.src = './imgs/arrowDown.png';
ARROW_RIGHT_IMAGE.src = './imgs/arrowRight.png';
ARROW_LEFT_IMAGE.src = './imgs/arrowLeft.png';

const LEVELS = [
    {
        player: { x: 0, y: 0 },
        endTile: { x: 3, y: 3 },
        path: [
            Direction.DOWN,
            Direction.RIGHT,
            Direction.DOWN,
            Direction.RIGHT,
            Direction.DOWN,
            Direction.RIGHT
        ]
    },
    {
        player: { x: 1, y: 4 },
        endTile: { x: 4, y: 0 },
        path: [
            Direction.UP,
            Direction.UP,
            Direction.UP,
            Direction.RIGHT,
            Direction.RIGHT,
            Direction.DOWN,
            Direction.RIGHT,
            Direction.UP,
            Direction.UP
        ]
    }
];


const canvas = document.querySelector('canvas.game-field') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
const timerFiller = document.querySelector('span.timer-filler') as HTMLSpanElement;

let player: Point = { x: 0, y: 0 };
let finishTile: Point = { x: 0, y: 0 };
let currentPath: Direction[];
let gameState: GameState = GameState.NONE;
let time: number;
let gameTime = 2_000;
let numWins = 0;

if (canvas == null) {
    console.error("No canvas found!");
}

if (timerFiller == null) {
    console.error("No timer filler!");
}

if (ctx == null) {
    console.error("No rendering context!");
}

const gridToPixels = (p: Point): Point => {
    return {
        x: canvas.width / GRID_WIDTH * p.x,
        y: canvas.height / GRID_HEIGHT * p.y
    };
};

const rand = (min: number, max: number): number => {
    return Math.floor(Math.random() * max) + min;
}

const tick = (): void => {
    clear();
    render();

    let deltaTime = new Date().getTime() - time;
    if (deltaTime >= 1_000 && gameState === GameState.PATH_VIEW) {
        gameState = GameState.GAME;
        time = new Date().getTime();
    } else if (gameState === GameState.GAME) {
        timerFiller.style.width = `${(1 - deltaTime / gameTime) * 100}%`;
        if (deltaTime >= gameTime) {
            loose();
        }
    } else if (deltaTime >= 1_000 && gameState === GameState.WON) {
        if (numWins === 3) gameTime = 950;
        else if (numWins === 5) gameTime = 900;
        else if (numWins === 10) gameTime = 850;
        else if (numWins === 15) gameTime = 750;
        play();
    }

    requestAnimationFrame(tick);
}

const play = (): void => {
    generateGame();
    gameState = GameState.PATH_VIEW;
    time = new Date().getTime();
}

const win = (): void => {
    numWins++;
    gameState = GameState.WON;
    time = new Date().getTime();
}

const loose = (): void => {
    numWins = 0;
    gameState = GameState.LOST;
}

const generateGame = (): void => {
    
    const i = rand(0, LEVELS.length);
    const level = LEVELS[i];
    player = { x: level.player.x, y: level.player.y };
    finishTile = { x: level.endTile.x, y: level.endTile.y };
    currentPath = [...level.path];

}

const clear = (): void => {
    if (ctx == null) return;

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

const render = (): void => {
    if (ctx == null) return;

    ctx.imageSmoothingEnabled = false;

    if (gameState === GameState.WON) {
        ctx.font = '92px serif';
        ctx.fillStyle = GRID_COLOR;
        ctx.fillText("Won!", 150, 300);
        return;
    }

    if (gameState === GameState.PATH_VIEW || gameState === GameState.GAME) {
        // Draw finish tile
        ctx.fillStyle = FINISH_COLOR;
        const flu = gridToPixels({ x: finishTile.x + PLAYER_MARGIN, y: finishTile.y + PLAYER_MARGIN });
        const frd = gridToPixels({ x: finishTile.x + 1 - PLAYER_MARGIN, y: finishTile.y + 1 - PLAYER_MARGIN });
        ctx.fillRect(flu.x, flu.y, frd.x - flu.x, frd.y - flu.y);

        // Draw player
        ctx.fillStyle = PLAYER_COLOR;
        const plu = gridToPixels({ x: player.x + PLAYER_MARGIN, y: player.y + PLAYER_MARGIN });
        const prd = gridToPixels({ x: player.x + 1 - PLAYER_MARGIN, y: player.y + 1 - PLAYER_MARGIN });
        ctx.fillRect(plu.x, plu.y, prd.x - plu.x, prd.y - plu.y);
    }

    // Draw path
    if (gameState === GameState.PATH_VIEW) {
        ctx.fillStyle = PATH_COLOR;
        let p = { x: player.x, y: player.y };
        for (let d of currentPath) {
            let img;
            let move: Point;
            switch (d) {
                case Direction.UP:
                    img = ARROW_UP_IMAGE;
                    move = { x: 0, y: -1 };
                    break;

                case Direction.DOWN:
                    img = ARROW_DOWN_IMAGE;
                    move = { x: 0, y: 1 };
                    break;

                case Direction.RIGHT:
                    img = ARROW_RIGHT_IMAGE;
                    move = { x: 1, y: 0 };
                    break;

                case Direction.LEFT:
                    img = ARROW_LEFT_IMAGE;
                    move = { x: -1, y: 0 };
                    break;

                default:
                    console.error("Unknown direction");
                    return;
            }
            const alu = gridToPixels({ x: p.x, y: p.y });
            const ard = gridToPixels({ x: p.x + 1, y: p.y + 1 });
            ctx.fillRect(alu.x, alu.y, ard.x - alu.x, ard.y - alu.y);
            ctx.drawImage(img, alu.x, alu.y, ard.x - alu.x, ard.y - alu.y);

            p = { x: p.x + move.x, y: p.y + move.y };
        }
    }

    // Draw grid
    ctx.strokeStyle = GRID_COLOR;
    for (let x = 0; x < GRID_WIDTH; x++) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            const lu = gridToPixels({ x, y });
            const rd = gridToPixels({ x: x + 1, y: y + 1 });
            ctx.strokeRect(lu.x, lu.y, rd.x - lu.x, rd.y - lu.y);
        }
    }
}

const getInput = (e: KeyboardEvent): void => {
    if (gameState !== GameState.GAME) return;
    switch (e.key) {
        case 'ArrowUp':
            if (currentPath.splice(0, 1)[0] !== Direction.UP) {
                loose();
                return;
            }
            
            player.y--;
            break;
            
        case 'ArrowDown':
            if (currentPath.splice(0, 1)[0] !== Direction.DOWN) {
                loose();
                return;
            }
            player.y++;
        
            break;
            
        case 'ArrowRight':
            if (currentPath.splice(0, 1)[0] !== Direction.RIGHT) {
                loose();
                return;
            }
            player.x++;
            
            break;

        case 'ArrowLeft':
            if (currentPath.splice(0, 1)[0] !== Direction.LEFT) {
                loose();
                return;
            }
            player.x--;
            
            break;

        default: return;
    }
    if (currentPath.length === 0) {
        win();
    }
}

document.addEventListener('keydown', getInput);

requestAnimationFrame(tick);