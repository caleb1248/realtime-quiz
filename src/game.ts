import { socket } from "./main";

interface IGameData {
  players: {
    x: number;
    y: number;
    color: string;
    angle: number;
    id: string;
  }[];

  bullets: {
    x: number;
    y: number;
    color: string;
  }[];
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI, false);
  ctx.fillStyle = color;
  ctx.fill();
}

export const start = async () => {
  console.log("starting up");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  canvas.style.cssText = "position: fixed; top: 0; left: 0;";

  let gameData: IGameData = {
    players: [],
    bullets: [],
  };

  let id = null as string | null;

  socket.on("id", (i) => {
    id = i;
  });

  socket.on("update", (data: IGameData) => (gameData = data));
  socket.on("disconnect", () => console.log("oop disconnected :("));
  socket.on("dead", () => {
    alert("u died xD");
    cancelAnimationFrame(f);
    history.go(0);
  });

  const keys = {
    up: false,
    left: false,
    down: false,
    right: false,
  };

  function frame() {
    let translate = { x: 0, y: 0 };
    if (id && gameData.players.find((player) => player.id === id)) {
      const { x, y } = gameData.players.find((player) => player.id === id) as {
        x: number;
        y: number;
      };
      translate = {
        x: -x + window.innerWidth / 2,
        y: -y + window.innerHeight / 2,
      };
    }

    ctx?.translate(translate.x, translate.y);
    gameData.players.forEach(({ x, y, color }) => {
      drawCircle(ctx as CanvasRenderingContext2D, x, y, 20, color);
    });
    gameData.bullets.forEach(({ x, y, color }) => {
      console.log(x, y, color)
      drawCircle(ctx as CanvasRenderingContext2D, x, y, 5, color);
    });

    ctx?.translate(-translate.x, -translate.y);

    f = requestAnimationFrame(frame);
  }

  let f = requestAnimationFrame(frame);

  canvas.addEventListener("mousedown", () => {
    socket.emit("shoot");
  });

  window.addEventListener("keydown", ({ key, repeat }) => {
    if (repeat) return;
    key = key.toLowerCase();
    if (key === "w") {
      keys.up = true;
    } else if (key === "a") {
      keys.left = true;
    } else if (key === "s") {
      keys.down = true;
    } else if (key === "d") {
      keys.right = true;
    } else if (key === "arrowup") {
      keys.up = true;
    } else if (key === "arrowleft") {
      keys.down = true;
    } else if (key === "arrowdown") {
      keys.left = true;
    } else if (key === "arrowright") {
      keys.right = true;
    }
    socket.emit("keys", keys);
  });

  window.addEventListener("keyup", ({ key, repeat }) => {
    if (repeat) return;
    key = key.toLowerCase();
    if (key === "w") {
      keys.up = false;
    } else if (key === "a") {
      keys.left = false;
    } else if (key === "s") {
      keys.down = false;
    } else if (key === "d") {
      keys.right = false;
    } else if (key === "arrowup") {
      keys.up = false;
    } else if (key === "arrowleft") {
      keys.down = false;
    } else if (key === "arrowdown") {
      keys.left = false;
    } else if (key === "arrowright") {
      keys.right = false;
    }

    socket.emit("keys", keys);
  });
};
