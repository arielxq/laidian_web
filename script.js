// ========== 產品輪播 ==========
class ProductCarousel {
  constructor() {
    this.carouselInner = document.querySelector('.carousel-inner');
    this.originalItems = Array.from(document.querySelectorAll('.carousel-item'));
    this.prevBtn = document.querySelector('.carousel-btn.prev');
    this.nextBtn = document.querySelector('.carousel-btn.next');
    this.dotsContainer = document.querySelector('.carousel-dots');
    this.totalItems = this.originalItems.length;
    this.autoplayInterval = null;
    this.isAnimating = false;
    this.currentPos = 1;

    if (this.carouselInner && this.originalItems.length) {
      this.setupInfiniteClones();
      this.setupDots();
      this.init();
      this.updateDots();
    }
  }

  setupInfiniteClones() {
    const first = this.originalItems[0].cloneNode(true);
    const last = this.originalItems[this.totalItems - 1].cloneNode(true);
    first.setAttribute('aria-hidden', 'true');
    last.setAttribute('aria-hidden', 'true');

    this.carouselInner.appendChild(first);
    this.carouselInner.insertBefore(last, this.originalItems[0]);

    this.items = Array.from(this.carouselInner.querySelectorAll('.carousel-item'));
    this.carouselInner.style.transition = 'none';
    this.carouselInner.style.transform = `translateX(-${this.currentPos * 100}%)`;
  }

  init() {
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => { this.pauseAutoplay(); this.prev(); this.startAutoplay(); });
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => { this.pauseAutoplay(); this.next(); this.startAutoplay(); });

    this.carouselInner.addEventListener('transitionend', (e) => {
      if (e.target !== this.carouselInner) return;
      this.onTransitionEnd();
    });

    this.startAutoplay();
    this.carouselInner.parentElement.addEventListener('mouseenter', () => this.pauseAutoplay());
    this.carouselInner.parentElement.addEventListener('mouseleave', () => this.startAutoplay());
  }

  setupDots() {
    if (!this.dotsContainer) return;
    this.dotsContainer.innerHTML = '';

    this.originalItems.forEach((item, index) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      dot.type = 'button';
      const itemName = item.querySelector('h3')?.textContent || `第 ${index + 1} 個產品`;
      dot.setAttribute('aria-label', `查看 ${itemName}`);

      dot.addEventListener('click', () => {
        if (this.isAnimating) return;
        this.pauseAutoplay();
        this.currentPos = index + 1;
        this.isAnimating = true;
        this.animateTo(this.currentPos);
        this.startAutoplay();
      });

      this.dotsContainer.appendChild(dot);
    });
  }

  prev() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.currentPos--;
    this.animateTo(this.currentPos);
  }

  next() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.currentPos++;
    this.animateTo(this.currentPos);
  }

  animateTo(pos) {
    this.carouselInner.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    this.carouselInner.style.transform = `translateX(-${pos * 100}%)`;
    this.updateDots();
  }

  onTransitionEnd() {
    this.isAnimating = false;
    if (this.currentPos === 0) {
      this.currentPos = this.totalItems;
      this.carouselInner.style.transition = 'none';
      this.carouselInner.style.transform = `translateX(-${this.currentPos * 100}%)`;
    } else if (this.currentPos === this.totalItems + 1) {
      this.currentPos = 1;
      this.carouselInner.style.transition = 'none';
      this.carouselInner.style.transform = `translateX(-${this.currentPos * 100}%)`;
    }
    this.updateDots();
  }

  startAutoplay() {
    if (this.autoplayInterval) return;
    this.autoplayInterval = setInterval(() => this.next(), 4000);
  }

  pauseAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }

  updateDots() {
    if (!this.dotsContainer) return;
    const realIndex = ((this.currentPos - 1 + this.totalItems) % this.totalItems);
    this.dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, index) => {
      dot.classList.toggle('is-active', index === realIndex);
      dot.setAttribute('aria-current', index === realIndex ? 'true' : 'false');
    });

    if (this.items) {
      this.items.forEach((item, index) => {
        item.classList.toggle('is-active', index === this.currentPos);
      });
    }
  }
} // 💡 關鍵修復：補上了這個遺失的 class 結尾括號！

// ========== 初始化與 DOM 事件 ==========
let carousel;

document.addEventListener('DOMContentLoaded', () => {
  try { setupLottieMood(); } catch (e) { console.error("Lottie 錯誤:", e); }
  try { initProductImageLoading(); } catch (e) { console.error("圖片加載錯誤:", e); }
  try {
    if (document.querySelector('.carousel-inner')) carousel = new ProductCarousel();
  } catch (e) { console.error("輪播錯誤:", e); }

  setupSectionReveal();
  setupCursorGlow();
  setupCardTilt();
  setupStoreDetails();
  setupProductLightbox();

  // 防止右鍵與拖曳
  document.addEventListener('contextmenu', (e) => e.preventDefault(), false);
  document.querySelectorAll('img, dotlottie-player').forEach(el => el.setAttribute('draggable', 'false'));
});

// ========== 全局加載控制 (Loading 遮罩) ==========
window.addEventListener("load", hideLoader);
// 防呆機制：如果 4 秒後 window.load 還沒觸發，強制關閉 loading
setTimeout(hideLoader, 4000);

function hideLoader() {
  const loader = document.getElementById("loader-wrapper");
  if (loader && !loader.classList.contains("hidden")) {
    loader.classList.add("hidden");
  }
}

// ========== 響應式調整 ==========
window.addEventListener('resize', () => {
  if (carousel && typeof carousel.animateTo === 'function') {
    carousel.animateTo(carousel.currentPos);
  }
});

// ========== 頁面導覽功能 ==========
function setupSectionReveal() {
  const sections = Array.from(document.querySelectorAll('.section'));
  const railLinks = Array.from(document.querySelectorAll('.section-rail a'));
  if (!sections.length) return;

  let ticking = false;
  const setActiveSection = () => {
    const viewportAnchor = window.innerHeight * 0.48;
    let activeSection = sections[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height * 0.5 - viewportAnchor);
      section.classList.toggle('is-visible', rect.bottom > window.innerHeight * 0.18 && rect.top < window.innerHeight * 0.82);
      if (distance < closestDistance) {
        closestDistance = distance;
        activeSection = section;
      }
    });

    railLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${activeSection.id}`));
    ticking = false;
  };

  const requestActiveUpdate = () => {
    if (!ticking) {
      requestAnimationFrame(setActiveSection);
      ticking = true;
    }
  };

  setActiveSection();
  window.addEventListener('scroll', requestActiveUpdate, { passive: true });
  window.addEventListener('resize', requestActiveUpdate);
}

// ========== 滑鼠光暈與卡片傾斜 ==========
function setupCursorGlow() {
  const glow = document.querySelector('.cursor-glow');
  if (!glow || window.matchMedia('(pointer: coarse)').matches) return;
  let currentX = window.innerWidth / 2, currentY = window.innerHeight / 2;
  let targetX = currentX, targetY = currentY;

  const moveGlow = () => {
    currentX += (targetX - currentX) * 0.16;
    currentY += (targetY - currentY) * 0.16;
    glow.style.transform = `translate3d(${currentX - 60}px, ${currentY - 60}px, 0)`;
    requestAnimationFrame(moveGlow);
  };
  window.addEventListener('pointermove', e => { targetX = e.clientX; targetY = e.clientY; glow.classList.add('is-visible'); }, { passive: true });
  window.addEventListener('pointerleave', () => glow.classList.remove('is-visible'));
  moveGlow();
}

function setupCardTilt() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('.store-card.active, .story-section').forEach(card => {
    card.addEventListener('pointermove', e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--tilt-card', `${(((e.clientX - rect.left) / rect.width) - 0.5) * 2.4}deg`);
    }, { passive: true });
    card.addEventListener('pointerleave', () => card.style.removeProperty('--tilt-card'));
  });
}

function setupLottieMood() {
  document.querySelectorAll('dotlottie-player').forEach(player => {
    const defaultSpeed = Number(player.getAttribute('speed')) || 1;
    player.addEventListener('mouseenter', () => player.setSpeed?.(defaultSpeed * 1.25) || player.getLottie?.().setSpeed(defaultSpeed * 1.25));
    player.addEventListener('mouseleave', () => player.setSpeed?.(defaultSpeed) || player.getLottie?.().setSpeed(defaultSpeed));
  });
}

// ========== 產品圖片動態加載 ==========
function initProductImageLoading() {
  const carouselItems = document.querySelectorAll('#products .carousel-item');
  const productData = [
    { folder: 'city-postcards', name: '城市字繪系列明信片', images: ['zihui1.webp', 'zihui3.webp', 'zihui2.webp'] },
    { folder: 'heritage-postcards', name: '文化資產系列明信片', images: ['P5091815-1400.webp', 'P5091740-1400.webp', 'P5091789.webp'] },
    { folder: 'yinpiao-postcards', name: '銀票系列明信片', images: ['yinpiao1.webp', 'yinpiao2.webp', 'yinpiao3.webp'] },
    { folder: 'taiwan-stampbook', name: '台灣地圖字繪印章本', images: ['stampbook1.webp', 'stampbook2.webp', 'stampbook3.webp'] },
    { folder: 'taiwan-travel-journal', name: '台灣旅行手帳本', images: ['P4291378-1400.webp', 'P4291379-1400.webp', 'P4291388-1400.webp'] }
  ];

  carouselItems.forEach(item => {
    const itemTitle = item.querySelector('h3')?.textContent?.trim() || '';
    const currentData = productData.find(p => itemTitle.includes(p.name));
    const gallery = item.querySelector('.product-gallery');

    if (!currentData || !gallery) return;
    gallery.innerHTML = '';

    currentData.images.forEach((imgName, index) => {
      const img = document.createElement('img');
      img.src = `images/${currentData.folder}/${imgName.trim()}`;
      img.draggable = false;
      img.alt = `${currentData.name} ${index + 1}`;
      img.className = item.getAttribute('data-clickable') === 'true' ? 'gallery-img product-img-clickable' : 'gallery-img';

      img.onload = () => img.classList.add('loaded');
      img.onerror = () => { console.error("圖片加載失敗:", img.src); img.classList.add('loaded'); };
      gallery.appendChild(img);
      if (img.complete) img.classList.add('loaded');
    });
  });
}

// ========== 通用彈出層與縮放功能 ==========
function setupStoreDetails() {
  const storeImages = {
    'taidao': 'images/tiedao.webp', 'douhua': 'images/douhua.webp', 'nongzhai': 'images/nongzhai.webp',
    'youce': 'images/youce.webp', 'gaoxiong': 'images/sanluzhiyi.webp', 'japan': 'images/lutai.webp'
  };

  const modal = document.getElementById('storeDetailModal');
  const modalImage = modal?.querySelector('.store-detail-img');
  if (!modal || !modalImage) return;

  document.querySelectorAll('.store-detail-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      modalImage.src = storeImages[btn.getAttribute('data-store')] || '';
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  });

  setupMobilePinchZoom(modal, modalImage, modal.querySelector('.store-detail-close'), modal.querySelector('.store-detail-backdrop'));
}

function setupProductLightbox() {
  // 原本的燈箱結構不存在於 HTML 內，這裡補上動態建立，確保不影響原本功能
  let lightbox = document.getElementById('productLightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.id = 'productLightbox';
    lightbox.className = 'image-lightbox hidden';
    lightbox.innerHTML = `
      <div class="image-lightbox-backdrop"></div>
      <div class="image-lightbox-panel">
        <button type="button" class="image-lightbox-close">×</button>
        <img class="image-lightbox-img" alt="產品大圖">
      </div>`;
    document.body.appendChild(lightbox);
  }

  const lightboxImg = lightbox.querySelector('.image-lightbox-img');
  document.addEventListener('click', e => {
    if (e.target.classList.contains('product-img-clickable')) {
      e.preventDefault();
      lightboxImg.src = e.target.src;
      lightbox.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  });

  setupMobilePinchZoom(lightbox, lightboxImg, lightbox.querySelector('.image-lightbox-close'), lightbox.querySelector('.image-lightbox-backdrop'));
}

function setupMobilePinchZoom(modal, img, closeBtn, backdrop) {
  let scale = 1, lastScale = 1, startDist = 0, startX = 0, startY = 0, translateX = 0, translateY = 0, isPinched = false, isPanning = false;

  const resetZoom = () => {
    scale = 1; translateX = 0; translateY = 0;
    img.style.transform = 'translate(0px, 0px) scale(1)';
    img.style.transition = 'transform 0.3s ease';
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  };

  const updateTransform = () => {
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    img.style.transition = 'none';
  };

  const getDistance = (t1, t2) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

  img.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      isPinched = true; startDist = getDistance(e.touches[0], e.touches[1]); lastScale = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      isPanning = true; startX = e.touches[0].clientX - translateX; startY = e.touches[0].clientY - translateY;
    }
  }, { passive: false });

  img.addEventListener('touchmove', e => {
    if (e.touches.length === 2 && isPinched) {
      e.preventDefault();
      scale = Math.min(Math.max(lastScale * (getDistance(e.touches[0], e.touches[1]) / startDist), 1), 4);
      updateTransform();
    } else if (e.touches.length === 1 && isPanning && scale > 1) {
      e.preventDefault();
      translateX = e.touches[0].clientX - startX; translateY = e.touches[0].clientY - startY;
      updateTransform();
    }
  }, { passive: false });

  img.addEventListener('touchend', e => {
    if (e.touches.length < 2) isPinched = false;
    if (e.touches.length === 0) isPanning = false;
    if (scale <= 1) { img.style.transform = 'translate(0px, 0px) scale(1)'; translateX = 0; translateY = 0; }
  });

  // 電腦版滾輪與拖曳支援
  img.addEventListener('wheel', e => {
    e.preventDefault();
    scale = Math.min(Math.max(scale + Math.sign(e.deltaY) * -0.12, 1), 4);
    if (scale === 1) { translateX = 0; translateY = 0; }
    updateTransform();
  }, { passive: false });

  img.addEventListener('pointerdown', e => {
    if (scale > 1) { isPanning = true; img.setPointerCapture(e.pointerId); startX = e.clientX - translateX; startY = e.clientY - translateY; }
  });

  img.addEventListener('pointermove', e => {
    if (isPanning) { e.preventDefault(); translateX = e.clientX - startX; translateY = e.clientY - startY; updateTransform(); }
  });

  img.addEventListener('pointerup', () => isPanning = false);
  img.addEventListener('dblclick', () => { scale = 1; translateX = 0; translateY = 0; updateTransform(); });

  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.classList.contains('hidden')) resetZoom(); });
  if (closeBtn) closeBtn.addEventListener('click', resetZoom);
  if (backdrop) backdrop.addEventListener('click', resetZoom);
}