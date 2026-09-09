const canvas = document.getElementById('frameCanvas');
const ctx = canvas.getContext('2d');
const section = document.querySelector('.intro');
const totalFrames = 125;
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

  const imgRatio = img.width / img.height;
  const canvasRatio = canvas.width / canvas.height;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (canvasRatio > imgRatio) {
    drawHeight = canvas.height;
    drawWidth = canvas.height * imgRatio;
    offsetX = (canvas.width - drawWidth) / 2;
    offsetY = 0;
  } else {
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

// --- Show more ---
const showMoreBtn = document.getElementById('showMoreBtn');

showMoreBtn.addEventListener('click', () => {
  document.querySelectorAll('.gallery-hidden').forEach(el => {
    el.classList.remove('gallery-hidden');
  });
  showMoreBtn.style.display = 'none';
});

// --- Lightbox ---
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

let currentIndex = 0;

function openLightbox(index) {
  currentIndex = index;
  lightboxImg.src = galleryItems[currentIndex].src;
  lightbox.classList.add('active');
}

function closeLightbox() {
  lightbox.classList.remove('active');
}

function changeImage(newIndex) {
  lightboxImg.classList.add('switching');
  setTimeout(() => {
    currentIndex = newIndex;
    lightboxImg.src = galleryItems[currentIndex].src;
    lightboxImg.classList.remove('switching');
  }, 200);
}

function showNext() {
  changeImage((currentIndex + 1) % galleryItems.length);
}

function showPrev() {
  changeImage((currentIndex - 1 + galleryItems.length) % galleryItems.length);
}

galleryItems.forEach((item, index) => {
  item.addEventListener('click', () => openLightbox(index));
});

lightboxClose.addEventListener('click', closeLightbox);
lightboxNext.addEventListener('click', showNext);
lightboxPrev.addEventListener('click', showPrev);

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') showNext();
  if (e.key === 'ArrowLeft') showPrev();
});