import "./style.css";

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
toolbar.append(clearBtn, undoBtn, redoBtn);

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
}

function dispatchChanged() {
  redraw();
  undoBtn.disabled = commands.length === 0;
  redoBtn.disabled = redoCommands.length === 0;
}

// Mouse handlers
canvas.addEventListener("mousedown", (e) => {
  const start = getPos(e);
  activeStroke = new MarkerStroke(start);
  commands.push(activeStroke);
  redoCommands = [];
  dispatchChanged();
});

canvas.addEventListener("mousemove", (e) => {
  if (!activeStroke) return;
  activeStroke.drag(getPos(e));
  dispatchChanged();
});

["mouseup", "mouseleave"].forEach((ev) =>
  canvas.addEventListener(ev, () => {
    activeStroke = null;
  })
);

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

// Initial draw
dispatchChanged();
