import "./style.css";

// Title
const appTitle: HTMLHeadingElement = document.createElement("h1");
appTitle.textContent = "Quaint Paint";
document.body.append(appTitle);

// Toolbar
const toolbar = document.createElement("div");
toolbar.className = "toolbar";
document.body.append(toolbar);

// Canvas
const canvas: HTMLCanvasElement = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

// Context + white background
const ctx = canvas.getContext("2d")!;
ctx.fillStyle = "#fff";
ctx.fillRect(0, 0, canvas.width, canvas.height);

type Point = { x: number; y: number };
let displayList: Point[][] = [];
let currentStroke: Point[] | null = null;

// Redraw from the model
const redraw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#111";

  for (const stroke of displayList) {
    if (stroke.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x, stroke[i].y);
    }
    ctx.stroke();
  }
};

// Buttons
const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";
toolbar.append(clearBtn);
const undoBtn = document.createElement("button");
undoBtn.textContent = "Undo";
const redoBtn = document.createElement("button");
redoBtn.textContent = "Redo";
toolbar.append(undoBtn, redoBtn);

let redoStack: Point[][] = [];

function updateHistoryButtons() {
  undoBtn.disabled = displayList.length === 0;
  redoBtn.disabled = redoStack.length === 0;
}

const dispatchChanged = () => {
  updateHistoryButtons();
  canvas.dispatchEvent(new Event("drawing-changed"));
};

canvas.addEventListener("drawing-changed", redraw);

// Mouse helpers + handlers (record, then redraw)
function getPos(e: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener("mousedown", (e) => {
  redoStack = [];

  currentStroke = [];
  displayList.push(currentStroke);
  currentStroke.push(getPos(e));
  dispatchChanged();
});

canvas.addEventListener("mousemove", (e) => {
  if (!currentStroke) return;
  currentStroke.push(getPos(e));
  dispatchChanged();
});

["mouseup", "mouseleave"].forEach((ev) =>
  canvas.addEventListener(ev, () => {
    currentStroke = null;
  })
);

// Clear wipes both stacks
clearBtn.addEventListener("click", () => {
  displayList = [];
  redoStack = [];
  dispatchChanged();
});

// Undo/Redo logic
undoBtn.onclick = () => {
  if (displayList.length === 0) return;
  const popped = displayList.pop()!;
  redoStack.push(popped);
  dispatchChanged();
};

redoBtn.onclick = () => {
  if (redoStack.length === 0) return;
  const popped = redoStack.pop()!;
  displayList.push(popped);
  dispatchChanged();
};

updateHistoryButtons();
