import { Server, Socket } from "socket.io";

const io = new Server(3000, {
  // options
});

const gameData = {
  width: 1000,
  height: 1000,
  bulletRadius: 5,
  playerRadius: 20,
};

Object.freeze(gameData);

io.on("connection", (socket) => {
  const player = new Player(socket);
  players.push(player);
  console.log("player connected", { ...player, socket: undefined });
  socket.on("disconnect", () => {
    players.splice(players.indexOf(player), 1);
    console.log("player disconnected");
  });
});

const genId = (length: number) =>
  Array(length)
    .fill("")
    .map(
      () =>
        "QWERTYUIOPASDFGHJKLLZXCVBNM-qwertyuiopasdfghjklzxcvbnm1234567890".split(
          ""
        )[Math.floor(Math.random() * 26 * 2 + 10 + 1)]
    )
    .join("");

const players: Player[] = [];
const bullets: Bullet[] = [];

const update = () => {
  players.forEach((player) => player.update());
  const bulletsToRemove: Bullet[] = [];
  bullets.forEach((bullet) => bullet.update() && bulletsToRemove.push(bullet));
  bulletsToRemove
    .reverse()
    .forEach((bullet) => bullets.splice(bullets.indexOf(bullet)));

  io.emit("update", {
    meta: gameData,
    players: players.map((player) => player.getData()),
    bullets: bullets.map((bullet) => bullet.getData()),
  });
};

setInterval(update, 1000 / 60);

class Player {
  x: number;
  y: number;
  radius: number;
  color: string;
  velocity: number;
  angle: number;
  socket: Socket;
  vy: number;
  maxVelocity: number;
  vx: number;
  keys: { left: boolean; right: boolean; up: boolean; down: boolean };
  acceleration: number;
  friction: number;
  score: number;
  id: string;
  constructor(socket: Socket) {
    this.id = genId(30);
    socket.emit("id", this.id);
    this.x = Math.random() * gameData.width * 2 - gameData.width;
    this.y = Math.random() * gameData.height * 2 - gameData.height;
    this.radius = gameData.playerRadius;
    this.color = "#" + Math.round(Math.random() * (0xffffff - 1)).toString(16);
    this.velocity = 0;
    this.angle = 0;
    this.socket = socket;
    this.vx = 0;
    this.vy = 0;
    this.maxVelocity = 10;
    this.acceleration = 0.3;
    this.friction = this.acceleration;
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
    };
    this.score = 0;

    this.bindSocketEvents();
  }

  bindSocketEvents() {
    this.socket.on("keys", (keys) => {
      if (keys) this.keys = keys;
    });

    this.socket.on("shoot", () =>{
      bullets.push(new Bullet(this.id, this.x, this.y, this.angle, this.color))
    }
    );
  }

  update() {
    if (this.keys.left) this.vx -= this.acceleration;
    if (this.keys.right) this.vx += this.acceleration;
    if (this.keys.up) this.vy -= this.acceleration;
    if (this.keys.down) this.vy += this.acceleration;
    if (Math.sqrt(this.vx ** 2 + this.vy ** 2) > this.maxVelocity) {
      const ratio = this.maxVelocity / Math.sqrt(this.vx ** 2 + this.vy ** 2);
      this.vx *= ratio;
      this.vy *= ratio;
    }

    this.x += this.vx;
    this.y += this.vy;
  }

  dead() {
    this.socket.emit("dead");
    players.splice(players.indexOf(this), 1);
  }

  getData() {
    return {
      x: this.x,
      y: this.y,
      radius: this.radius,
      color: this.color,
      angle: this.angle,
      score: this.score,
      id: this.id
    };
  }
}

class Bullet {
  speed: number;
  vx: number;
  vy: number;
  player: string;
  x: number;
  y: number;
  color: string;
  radius: number;
  constructor(
    player: string,
    x: number,
    y: number,
    angle: number,
    color: string
  ) {
    this.speed = 15;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.player = player;
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = gameData.bulletRadius;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (
      this.x < -gameData.width / 2 ||
      this.x > gameData.width / 2 ||
      this.y < -gameData.height / 2 ||
      this.y > gameData.height / 2
    )
      return true;

    for (let player of players) {
      if (
        player.id !== this.player && Math.sqrt((player.x - this.x) ** 2 + (player.y - this.y) ** 2) <
        player.radius + this.radius
      ) {
        const parent = players.find((p) => p.id === this.player);
        parent && parent.score++;
        player.dead();
        return true;
      }
    }
    return false;
  }

  getData() {
    return { x: this.x, y: this.y, radius: this.radius };
  }
}
