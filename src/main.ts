import "./style.css";

let currentTool: "marker" | "sticker" = "marker";

//sticker
const stickers = ["⭐", "🔥", "🎈"];
let currentSticker = stickers[0];
let stickerBtns: HTMLButtonElement[] = [];

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

class StickerCommand implements DisplayCommand {
  x: number;
  y: number;
  text: string;
  size: number;
  angle: number;
  constructor(x: number, y: number, text: string, size = 32, angle = 0) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.size = size;
    this.angle = angle;
  }
  drag(p: { x: number; y: number }) {
    this.x = p.x;
    this.y = p.y;
  }
  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.font =
      `${this.size}px system-ui, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#111";
    ctx.fillText(this.text, 0, 0);
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

class StickerPreview {
  x = 0;
  y = 0;
  set(p: { x: number; y: number }) {
    this.x = p.x;
    this.y = p.y;
  }
  display(ctx: CanvasRenderingContext2D, text: string, size = 32) {
    if (mouseDown) return;
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.font =
      `${size}px system-ui, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, this.x, this.y);
    ctx.restore();
  }
}

// Drawing state
let commands: DisplayCommand[] = [];
let redoCommands: DisplayCommand[] = [];
let activeStroke: MarkerStroke | null = null;
let activeSticker: StickerCommand | null = null;

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
const addStickerBtn = document.createElement("button");
addStickerBtn.textContent = "Add Sticker";
toolbar.append(clearBtn, undoBtn, redoBtn, thinBtn, thickBtn, addStickerBtn);

// Utilities
function getPos(e: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function renderStickerButtons() {
  // remove old buttons from the DOM
  for (const b of stickerBtns) b.remove();

  // rebuild from current stickers[]
  stickerBtns = stickers.map((s, i) => {
    const b = document.createElement("button");
    b.textContent = s;
    b.onclick = () => {
      currentTool = "sticker";
      currentSticker = stickers[i];
      selectTool(b);
      dispatchToolMoved();
    };
    toolbar.append(b);
    return b;
  });
}

// Redraw everything
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const cmd of commands) cmd.display(ctx);
  if (currentTool === "marker") {
    preview.display(ctx, currentWidth);
  } else {
    previewSticker.display(ctx, currentSticker, 32);
  }
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
  const allButtons = [thinBtn, thickBtn, ...stickerBtns];
  allButtons.forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
}

// Mouse handlers
const preview = new MarkerPreview();
const previewSticker = new StickerPreview();

canvas.addEventListener("mousedown", (e) => {
  mouseDown = true;

  const start = getPos(e);
  if (currentTool === "marker") {
    activeStroke = new MarkerStroke(start, currentWidth, currentColor);
    commands.push(activeStroke);
  } else { // sticker
    activeSticker = new StickerCommand(start.x, start.y, currentSticker, 32);
    commands.push(activeSticker);
  }

  redoCommands = [];
  dispatchChanged();
});

canvas.addEventListener("mousemove", (e) => {
  const p = getPos(e);
  preview.set(p);
  previewSticker.set(p);

  if (activeStroke) {
    activeStroke.drag(p);
    redraw();
    undoBtn.disabled = false;
  } else if (activeSticker) {
    activeSticker.drag(p);
    redraw();
    undoBtn.disabled = false;
  } else {
    dispatchToolMoved();
  }
});

["mouseup", "mouseleave"].forEach((ev) =>
  canvas.addEventListener(ev, () => {
    mouseDown = false;
    activeStroke = null;
    activeSticker = null;
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
  currentTool = "marker";
  currentWidth = 4;
  selectTool(thinBtn);
  dispatchToolMoved();
};

thickBtn.onclick = () => {
  currentTool = "marker";
  currentWidth = 10;
  selectTool(thickBtn);
  dispatchToolMoved();
};

addStickerBtn.onclick = () => {
  const text = prompt("Custom sticker text:", "🧽");
  if (!text) return;
  const value = text.trim();
  if (!value) return;

  stickers.push(value); // update data
  renderStickerButtons(); // rebuild buttons

  const newBtn = stickerBtns[stickerBtns.length - 1];
  currentTool = "sticker";
  currentSticker = value;
  selectTool(newBtn);
  dispatchToolMoved();
};

// Initial draw
renderStickerButtons();
selectTool(thinBtn);
dispatchChanged();
