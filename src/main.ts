import "./style.css";

// Title
const appTitle: HTMLHeadingElement = document.createElement("h1");
appTitle.textContent = "Quaint Paint";
document.body.append(appTitle);

// Toolbar (for buttons like Clear)
const toolbar = document.createElement("div");
toolbar.className = "toolbar";
document.body.append(toolbar);

// Canvas
const canvas: HTMLCanvasElement = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

// 1) Get 2D context and initialize a white background
const ctx = canvas.getContext("2d")!;
ctx.fillStyle = "#fff";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// 2) Drawing state
let drawing = false;
let lastX = 0;
let lastY = 0;

// Basic marker look
ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.lineWidth = 4;
ctx.strokeStyle = "#111"; // dark gray/black

function getPos(e: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

// Start stroke
canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  const { x, y } = getPos(e);
  lastX = x;
  lastY = y;
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  const { x, y } = getPos(e);
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
  lastX = x;
  lastY = y;
});

// End stroke on mouseup/leave
["mouseup", "mouseleave"].forEach((ev) =>
  canvas.addEventListener(ev, () => (drawing = false))
);

// 3) Clear button
const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";
toolbar.append(clearBtn);

clearBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
});
