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

const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

const YOUTUBE_API_KEY = 'AIzaSyBeXRiyovoB3U1JYnQYKKkUdwJ0Bm0MPn8';
const YOUTUBE_HANDLE = '@gearpoststudios';

const SHORT_MAX_SECONDS = 180;

async function youtubeRequest(endpoint, params) {
    const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);

    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });

    url.searchParams.set('key', YOUTUBE_API_KEY);

    const response = await fetch(url);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`YouTube API ${response.status}: ${errorText}`);
    }

    return response.json();
}

function durationToSeconds(duration) {
    const match = duration.match(
        /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
    );

    if (!match) return 0;

    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);
    const seconds = Number(match[3] || 0);

    return hours * 3600 + minutes * 60 + seconds;
}

async function getLatestNormalVideos() {
    try {
        const channelData = await youtubeRequest('channels', {
            part: 'contentDetails',
            forHandle: YOUTUBE_HANDLE
        });

        if (!channelData.items?.length) {
            throw new Error('Channel not found.');
        }

        const uploadsPlaylistId =
            channelData.items[0]
                .contentDetails
                .relatedPlaylists
                .uploads;

        const validVideos = [];
        let nextPageToken = '';

        while (validVideos.length < 2) {
            const playlistData = await youtubeRequest('playlistItems', {
                part: 'snippet,contentDetails',
                playlistId: uploadsPlaylistId,
                maxResults: 50,
                ...(nextPageToken ? { pageToken: nextPageToken } : {})
            });

            const videoIds = playlistData.items
                .map(item => item.contentDetails?.videoId)
                .filter(Boolean);

            if (!videoIds.length) break;

            const videoData = await youtubeRequest('videos', {
                part: 'snippet,contentDetails,liveStreamingDetails,status',
                id: videoIds.join(',')
            });

            for (const video of videoData.items) {
                if (video.liveStreamingDetails) continue;

                const duration = durationToSeconds(
                    video.contentDetails.duration
                );

                if (duration <= SHORT_MAX_SECONDS) continue;

                if (video.status?.privacyStatus !== 'public') continue;

                validVideos.push({
                    id: video.id,
                    title: video.snippet.title,
                    description: video.snippet.description,
                    publishedAt: video.snippet.publishedAt,
                    thumbnail:
                        video.snippet.thumbnails.high?.url ||
                        video.snippet.thumbnails.medium?.url ||
                        video.snippet.thumbnails.default?.url,
                    duration
                });

                if (validVideos.length >= 2) break;
            }

            nextPageToken = playlistData.nextPageToken || '';

            if (!nextPageToken) break;
        }

        return validVideos.slice(0, 2);

    } catch (error) {
        console.error('Failed to get YouTube videos:', error);
        return [];
    }
}

async function displayLatestVideos() {
    const container = document.getElementById('youtubeVideos');

    if (!container) return;

    container.innerHTML = `
        <p class="text">Loading videos...</p>
    `;

    const videos = await getLatestNormalVideos();

    if (!videos.length) {
        container.innerHTML = `
            <p class="text">No videos found.</p>
        `;
        return;
    }

    container.innerHTML = '';

    videos.forEach(video => {
        const wrapper = document.createElement('div');
        wrapper.className = 'youtube-video';

        const iframe = document.createElement('iframe');

        iframe.src = `https://www.youtube.com/embed/${video.id}`;
        iframe.title = video.title;
        iframe.loading = 'lazy';
        iframe.allow =
            'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;

        wrapper.appendChild(iframe);
        container.appendChild(wrapper);
    });
}

displayLatestVideos();