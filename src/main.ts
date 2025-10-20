import "./style.css";

//Stroke
let currentWidth = 4;
let mouseDown = false;
const currentColor = "#111";

// Title
const title = document.createElement("h1");
title.textContent = "Quaint Paint";
document.body.append(title);

// Toolbar
const toolbar = document.createElement("div");
toolbar.className = "toolbar";
document.body.append(toolbar);

// Canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

// Context setup
const ctx = canvas.getContext("2d")!;
ctx.fillStyle = "#fff";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// A shared interface for anything drawable
interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

// A command that represents one marker stroke
class MarkerStroke implements DisplayCommand {
  private points: { x: number; y: number }[] = [];
  private width: number;
  private color: string;

  constructor(start: { x: number; y: number }, width = 4, color = "#111") {
    this.points.push(start);
    this.width = width;
    this.color = color;
  }

  drag(p: { x: number; y: number }) {
    this.points.push(p);
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = this.width;
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

class MarkerPreview {
  x = 0;
  y = 0;
  set(p: { x: number; y: number }) {
    this.x = p.x;
    this.y = p.y;
  }
  display(ctx: CanvasRenderingContext2D, radius: number) {
    // only show when mouse is NOT down
    if (mouseDown) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "#555";
    ctx.stroke();
    ctx.restore();
  }
}
// Drawing state
let commands: DisplayCommand[] = [];
let redoCommands: DisplayCommand[] = [];
let activeStroke: MarkerStroke | null = null;

// Buttons
const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";
const undoBtn = document.createElement("button");
undoBtn.textContent = "Undo";
const redoBtn = document.createElement("button");
redoBtn.textContent = "Redo";
const thinBtn = document.createElement("button");
thinBtn.textContent = "Thin";
const thickBtn = document.createElement("button");
thickBtn.textContent = "Thick";
toolbar.append(clearBtn, undoBtn, redoBtn, thinBtn, thickBtn);

// Utilities
function getPos(e: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

// Redraw everything
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const cmd of commands) cmd.display(ctx);

  preview.display(ctx, currentWidth);
}

function dispatchChanged() {
  redraw();
  undoBtn.disabled = commands.length === 0;
  redoBtn.disabled = redoCommands.length === 0;
}

function dispatchToolMoved() {
  canvas.dispatchEvent(new Event("tool-moved"));
}

function selectTool(btn: HTMLButtonElement) {
  [thinBtn, thickBtn].forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
}

// Mouse handlers
const preview = new MarkerPreview();

canvas.addEventListener("mousedown", (e) => {
  mouseDown = true;
  const start = getPos(e);
  activeStroke = new MarkerStroke(start, currentWidth, currentColor);
  commands.push(activeStroke);
  redoCommands = [];
  dispatchChanged();
});

canvas.addEventListener("mousemove", (e) => {
  const p = getPos(e);
  preview.set(p);
  dispatchToolMoved();

  if (activeStroke) {
    activeStroke.drag(p);
    dispatchChanged();
  }
});

["mouseup", "mouseleave"].forEach((ev) =>
  canvas.addEventListener(ev, () => {
    mouseDown = false;
    activeStroke = null;
    dispatchToolMoved();
  })
);

canvas.addEventListener("tool-moved", redraw);

// Buttons
clearBtn.onclick = () => {
  commands = [];
  redoCommands = [];
  dispatchChanged();
};

undoBtn.onclick = () => {
  if (commands.length === 0) return;
  redoCommands.push(commands.pop()!);
  dispatchChanged();
};

redoBtn.onclick = () => {
  if (redoCommands.length === 0) return;
  commands.push(redoCommands.pop()!);
  dispatchChanged();
};

thinBtn.onclick = () => {
  currentWidth = 4;
  selectTool(thinBtn);
  dispatchToolMoved();
};

thickBtn.onclick = () => {
  currentWidth = 10;
  selectTool(thickBtn);
  dispatchToolMoved();
};

// Initial draw
selectTool(thinBtn);
dispatchChanged();
