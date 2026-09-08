const canvas = document.getElementById('frameCanvas');
const ctx = canvas.getContext('2d');
const section = document.querySelector('.intro');
const totalFrames = 216;
const images = [];

let ticking = false;
let currentFrame = 0;

function frameSrc(index) {
  const num = String(index + 1).padStart(3, '0');
  return `assets/img/sequence/frame_${num}.jpg`;
}

function preloadImages() {
  for (let i = 0; i < totalFrames; i++) {
    const img = new Image();
    img.src = frameSrc(i);
    images.push(img);
  }
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

function drawFrame(index) {
  const img = images[index];
  if (!img.complete) return;

  currentFrame = index;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // object-fit: contain (mostra a imagem toda, sem cortar)
  const imgRatio = img.width / img.height;
  const canvasRatio = canvas.width / canvas.height;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (canvasRatio > imgRatio) {
    // canvas mais "largo" → limita pela altura, barras nos lados
    drawHeight = canvas.height;
    drawWidth = canvas.height * imgRatio;
    offsetX = (canvas.width - drawWidth) / 2;
    offsetY = 0;
  } else {
    // canvas mais "alto" → limita pela largura, barras em cima/baixo
    drawWidth = canvas.width;
    drawHeight = canvas.width / imgRatio;
    offsetX = 0;
    offsetY = (canvas.height - drawHeight) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

function onScroll() {
  const rect = section.getBoundingClientRect();
  const sectionHeight = section.offsetHeight - window.innerHeight;
  const scrolled = -rect.top;

  let progress = scrolled / sectionHeight;
  progress = Math.min(Math.max(progress, 0), 1);

  const frameIndex = Math.round(progress * (totalFrames - 1));
  drawFrame(frameIndex);
}

window.addEventListener('resize', () => {
  resizeCanvas();
  drawFrame(currentFrame);
});

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      onScroll();
      ticking = false;
    });
    ticking = true;
  }
});

resizeCanvas();
preloadImages();
images[0].onload = () => drawFrame(0);

const showMoreBtn = document.getElementById('showMoreBtn');

showMoreBtn.addEventListener('click', () => {
  document.querySelectorAll('.gallery-hidden').forEach(el => {
    el.classList.remove('gallery-hidden');
  });
  showMoreBtn.style.display = 'none';
});