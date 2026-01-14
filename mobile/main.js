const url = '../archivo.pdf'; // Tu PDF
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');

let pdfDoc = null;
let paginaActual = 1;
let totalPaginas = 0;
let animando = false;

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
indicadorPagina.textContent = paginaActual;
indicadorPagina.style.minWidth = '38px';
indicadorPagina.style.padding = '4px 6px';
indicadorPagina.style.fontSize = 'clamp(0.65rem, 1.2vw, 0.75rem)';
indicadorPagina.style.color = '#fff';
indicadorPagina.style.minWidth = 'auto';
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

controles.append(
  btnMenos10,
  btnMenos1,
  indicadorPagina,
  btnMas1,
  btnMas10
);
document.body.appendChild(controles);

// -------------------- Canvas --------------------
function ajustarCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Dibujo centrado
function dibujarCentrado(img) {
  const x = (canvas.width - img.width) / 2;
  const y = (canvas.height - img.height) / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 10;
  ctx.shadowOffsetX = 0;

  ctx.drawImage(img, x, y);
  ctx.restore();

  return { x, y };
}

async function renderPaginaTemporal(num) {
  const page = await pdfDoc.getPage(num);
  const viewport = page.getViewport({ scale: 1 });

  const scale = Math.min(
    window.innerWidth / viewport.width,
    window.innerHeight / viewport.height
  );

  const scaledViewport = page.getViewport({ scale });
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = scaledViewport.width;
  tempCanvas.height = scaledViewport.height;

  await page.render({
    canvasContext: tempCanvas.getContext('2d'),
    viewport: scaledViewport
  }).promise;

  return tempCanvas;
}

// -------------------- Animación --------------------
async function animarPagina(nuevaPagina, direccion) {
  if (animando || nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
  animando = true;

  const nueva = await renderPaginaTemporal(nuevaPagina);
  const anterior = await renderPaginaTemporal(paginaActual);

  const xAnt = (canvas.width - anterior.width) / 2;
  const yAnt = (canvas.height - anterior.height) / 2;
  const xNew = (canvas.width - nueva.width) / 2;
  const yNew = (canvas.height - nueva.height) / 2;

  let progress = 0;
  const paso = 0.03;

  function anim() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ---- Hoja anterior ----
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = direccion === 'izquierda' ? -6 : 6;

    ctx.globalAlpha = 1 - progress * 0.8;
    ctx.drawImage(
      anterior,
      xAnt + (direccion === 'izquierda'
        ? -progress * canvas.width * 0.3
        : progress * canvas.width * 0.3),
      yAnt
    );
    ctx.restore();

    // ---- Hoja nueva ----
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetX = direccion === 'izquierda' ? -14 : 14;

    ctx.globalAlpha = 0.8 + progress * 0.2;
    ctx.drawImage(
      nueva,
      xNew + (direccion === 'izquierda'
        ? canvas.width * (1 - progress)
        : -canvas.width * (1 - progress)),
      yNew
    );
    ctx.restore();

    progress += paso;

    if (progress < 1) {
      requestAnimationFrame(anim);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dibujarCentrado(nueva);

paginaActual = nuevaPagina;
indicadorPagina.textContent = `${paginaActual} / ${totalPaginas}`;
      animando = false;
    }
  }

  anim();
}

// -------------------- PDF --------------------
pdfjsLib.getDocument(url).promise.then(pdf => {
  pdfDoc = pdf;
  totalPaginas = pdf.numPages;
  ajustarCanvas();

  renderPaginaTemporal(paginaActual).then(p => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dibujarCentrado(p);
indicadorPagina.textContent = `${paginaActual} / ${totalPaginas}`;
  });
});

// -------------------- Interacción --------------------
let startX = 0;
canvas.addEventListener('touchstart', e => startX = e.touches[0].clientX);

canvas.addEventListener('touchend', e => {
  const diff = startX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) {
    diff > 0
      ? animarPagina(paginaActual + 1, 'izquierda')
      : animarPagina(paginaActual - 1, 'derecha');
  }
});

btnMenos1.onclick  = () => animarPagina(paginaActual - 1, 'derecha');
btnMas1.onclick    = () => animarPagina(paginaActual + 1, 'izquierda');
btnMenos10.onclick = () => animarPagina(paginaActual - 10, 'derecha');
btnMas10.onclick   = () => animarPagina(paginaActual + 10, 'izquierda');

// -------------------- Ajustes --------------------
window.addEventListener('resize', () => {
  ajustarCanvas();
  renderPaginaTemporal(paginaActual).then(p => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dibujarCentrado(p);
  });
});

canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
