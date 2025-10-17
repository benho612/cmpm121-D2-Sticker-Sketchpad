import "./style.css";

const appTitle: HTMLHeadingElement = document.createElement("h1");
appTitle.textContent = "Quaint Paint";
document.body.append(appTitle);

const canvas: HTMLCanvasElement = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);
