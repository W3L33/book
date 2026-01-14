pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const container = document.getElementById("flipbook");
const url = '../archivo.pdf';

let pdfDoc = null;
let totalPaginas = 0;
let images = [];

// -------------------- Controles flotantes --------------------
const controles = document.createElement('div');
controles.style.position = 'fixed';
controles.style.bottom = '40px';
controles.style.left = '50%';
controles.style.transform = 'translateX(-50%)';
controles.style.display = 'flex';
controles.style.gap = '8px';
controles.style.zIndex = 1000;

function crearBoton(texto) {
  const btn = document.createElement('button');
  btn.textContent = texto;

  btn.style.fontSize = '0.9em';
  btn.style.padding = '4px 8px';
  btn.style.cursor = 'pointer';
  btn.style.background = 'rgba(90, 90, 90, 0.35)';
  btn.style.backdropFilter = 'blur(8px)';
  btn.style.webkitBackdropFilter = 'blur(8px)';
  btn.style.border = '1px solid rgba(255,255,255,0.3)';
  btn.style.borderRadius = '8px';
  btn.style.color = '#fff';
  btn.style.opacity = '0.45';

  btn.onmouseenter = () => btn.style.opacity = '0.85';
  btn.onmouseleave = () => btn.style.opacity = '0.45';

  return btn;
}

const btnMenos10 = crearBoton('<<');
const btnMenos1  = crearBoton('<');
const btnMas1    = crearBoton('>');
const btnMas10   = crearBoton('>>');

// Indicador de página
const indicadorPagina = document.createElement('span');
indicadorPagina.style.minWidth = '38px';
indicadorPagina.style.padding = '4px 6px';
indicadorPagina.style.fontSize = 'clamp(0.65rem, 1.2vw, 0.75rem)';
indicadorPagina.style.color = '#fff';
indicadorPagina.style.fontWeight = '600';
indicadorPagina.style.background = 'rgba(90,90,90,0.35)';
indicadorPagina.style.backdropFilter = 'blur(6px)';
indicadorPagina.style.borderRadius = '6px';
indicadorPagina.style.display = 'flex';
indicadorPagina.style.alignItems = 'center';
indicadorPagina.style.justifyContent = 'center';
indicadorPagina.style.fontFamily =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
indicadorPagina.style.fontVariantNumeric = 'tabular-nums';
indicadorPagina.style.fontFeatureSettings = '"tnum"';
indicadorPagina.style.whiteSpace = 'nowrap';

controles.append(btnMenos10, btnMenos1, indicadorPagina, btnMas1, btnMas10);
document.body.appendChild(controles);

// -------------------- Cargar PDF --------------------
async function cargarPDF() {
  pdfDoc = await pdfjsLib.getDocument(url).promise;
  totalPaginas = pdfDoc.numPages;

  const escala = 2;

  // Renderizar todas las páginas
  for (let i = 1; i <= totalPaginas; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: escala });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push(canvas.toDataURL("image/jpeg"));
  }

  // Agregar hoja final blanca si número de páginas impar
  if (totalPaginas % 2 !== 0) {
    const canvasFinal = document.createElement("canvas");
    const lastImg = new Image();
    lastImg.src = images[images.length - 1];
    await new Promise(res => lastImg.onload = res);
    canvasFinal.width = lastImg.width;
    canvasFinal.height = lastImg.height;
    const ctxFinal = canvasFinal.getContext("2d");
    ctxFinal.fillStyle = "#ffffff";
    ctxFinal.fillRect(0, 0, canvasFinal.width, canvasFinal.height);
    images.push(canvasFinal.toDataURL("image/jpeg"));
  }

  iniciarFlipbook();
}

// -------------------- Inicializar flipbook --------------------
function iniciarFlipbook() {
  const pageFlip = new St.PageFlip(container, {
    width: 700,
    height: 900,
    size: "stretch",
    minWidth: 400,
    maxWidth: 1000,
    minHeight: 300,
    maxHeight: 800,
    drawShadow: true,
    showCover: false,
    backgroundColor: "#ffffff"
  });

  pageFlip.loadFromImages(images);

  // -------------------- Funciones de navegación --------------------
  function avanzarPaginas(n) {
    let target = pageFlip.getCurrentPageIndex() + n;
    if (target > images.length - 1) target = images.length - 1;
    pageFlip.flip(target);
  }

  function retrocederPaginas(n) {
    let target = pageFlip.getCurrentPageIndex() - n;
    if (target < 0) target = 0;
    pageFlip.flip(target);
  }

  // -------------------- Controles --------------------
  btnMenos1.onclick  = () => pageFlip.flipPrev();
  btnMas1.onclick    = () => pageFlip.flipNext();
  btnMas10.onclick   = () => avanzarPaginas(10);
  btnMenos10.onclick = () => retrocederPaginas(10);

  // Navegación con flechas
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") pageFlip.flipNext();
    if (e.key === "ArrowLeft") pageFlip.flipPrev();
  });

  // Actualizar indicador de página
  pageFlip.on("flip", (e) => {
    const index = e.data; // índice interno del flipbook
    indicadorPagina.textContent = `${index + 1} / ${images.length}`;
  });

  // Inicializar indicador
  indicadorPagina.textContent = `1 / ${images.length}`;
}

// -------------------- Ejecutar --------------------
cargarPDF();


