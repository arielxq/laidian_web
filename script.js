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
    this.imageManifest = {};
    this.currentPos = 1; // 1..totalItems 對應真實items

    this.loadManifest().then(() => {
      if (!this.isInitialized) {
        this.setupLightbox();
        this.isInitialized = true;
      }
      if (this.carouselInner && this.originalItems.length) {
        this.setupProductImages();
        this.setupLightbox();
        this.setupInfiniteClones();
        this.setupDots();
        this.init();
        this.updateDots();
        // console.log("輪播初始化成功");
      }
    }).catch(err => console.error("輪播初始化失敗:", err));
  }

  setupInfiniteClones() {
    // 前後各複製一個 item，實現無縫循環
    const first = this.originalItems[0].cloneNode(true);
    const last = this.originalItems[this.totalItems - 1].cloneNode(true);
    first.setAttribute('aria-hidden', 'true');
    last.setAttribute('aria-hidden', 'true');

    this.carouselInner.appendChild(first);
    this.carouselInner.insertBefore(last, this.originalItems[0]);

    // 更新 items 清單（含 clone）
    this.items = Array.from(this.carouselInner.querySelectorAll('.carousel-item'));

    // 初始定位（無動畫）到 currentPos=1，即第一個真實 item
    this.carouselInner.style.transition = 'none';
    this.carouselInner.style.transform = `translateX(-${this.currentPos * 100}%)`;
  }

  init() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => { this.pauseAutoplay(); this.prev(); this.startAutoplay(); });
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => { this.pauseAutoplay(); this.next(); this.startAutoplay(); });
    }

    // 🔥 修改這裡：加入 e.target 判斷，阻擋子元素的動畫冒泡干擾
    this.carouselInner.addEventListener('transitionend', (e) => {
      // 如果觸發動畫結束的不是軌道本人，就直接 return 忽略
      if (e.target !== this.carouselInner) return;
      this.onTransitionEnd();
    });

    this.startAutoplay();

    this.carouselInner.parentElement.addEventListener('mouseenter', () => this.pauseAutoplay());
    this.carouselInner.parentElement.addEventListener('mouseleave', () => this.startAutoplay());
  }

  setupDots() {
    if (!this.dotsContainer) return;

    // 1. 強制清空容器，解決重複渲染問題
    this.dotsContainer.innerHTML = '';

    // 2. 嚴格只根據原始的 5 個項目來建立點點
    this.originalItems.forEach((item, index) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      dot.type = 'button';

      // 取得名稱，若失敗則使用預設
      const itemName = item.querySelector('h3')?.textContent || `第 ${index + 1} 個產品`;
      dot.setAttribute('aria-label', `查看 ${itemName}`);

      dot.addEventListener('click', () => {
        if (this.isAnimating) return;
        this.pauseAutoplay();
        // 點擊時，直接跳轉到該真實項目的位置
        this.currentPos = index + 1;
        this.isAnimating = true;
        this.animateTo(this.currentPos);
        this.updateDots();
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

    // 如果到達了 clone-last（pos=0），無縫跳到真實最後一個
    if (this.currentPos === 0) {
      this.currentPos = this.totalItems;
      this.carouselInner.style.transition = 'none';
      this.carouselInner.style.transform = `translateX(-${this.currentPos * 100}%)`;
    }
    // 如果到達了 clone-first（pos=totalItems+1），無縫跳到真實第一個
    else if (this.currentPos === this.totalItems + 1) {
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

  setupProductImages() {
    this.originalItems.forEach((item) => {
      const folder = item.dataset.folder;
      // 🌟 改為直接抓取 HTML 上的 data-images 屬性
      const imagesData = item.dataset.images;

      if (!folder || !imagesData) return;

      // 🌟 將逗號隔開的字串轉成陣列：["hero-1400.webp", "P4110704-1400.webp", ...]
      const imagesArray = imagesData.split(',').map(img => img.trim());
      const galleryImages = item.querySelectorAll('.gallery-img');

      galleryImages.forEach((img, index) => {
        // 依據 index (0, 1, 2) 分配對應的圖片檔名
        const fileName = imagesArray[index];
        if (fileName) {
          const fullPath = `images/${folder}/${fileName}`;
          img.src = fullPath;

          // 偵錯用：可以在主控台看路徑拼得對不對
          // console.log(`成功指派圖片路徑: ${fullPath}`);
        }
      });
    });
  }

  assignProductImage(img, folder, candidates) {
    // ... (省略前面建立 picture 標籤的邏輯)

    // 圖片路徑直接拼接：images/資料夾名稱/圖片名稱
    const originalPath = `images/${folder}/${candidates[0]}`;

    // ... (後續設定 img.src 與 onerror 邏輯)
    // 在 onerror 中，如果需要切換圖片，只需遍歷 candidates 陣列即可
    img.onerror = () => this.handleProductImageError(img, candidates, folder);
  }

  handleProductImageError(img, candidates, fallbackFolder) {
    const currentIndex = Number(img.dataset.candidateIndex || 0);
    const nextIndex = currentIndex + 1;
    const currentFolder = img.dataset.currentFolder || '';

    if (nextIndex < candidates.length) {
      const nextName = candidates[nextIndex];
      img.dataset.candidateIndex = String(nextIndex);
      img.dataset.fullSrc = `images/${currentFolder}/${nextName}`;
      img.src = img.dataset.fullSrc;
      return;
    }

    if (fallbackFolder && img.dataset.fallbackTried !== 'true') {
      img.dataset.fallbackTried = 'true';
      img.dataset.currentFolder = fallbackFolder;
      img.dataset.candidateIndex = '0';
      const fallbackName = candidates[0];
      img.dataset.fullSrc = `images/${fallbackFolder}/${fallbackName}`;
      img.src = img.dataset.fullSrc;
      return;
    }

    img.style.display = 'none';
  }

  loadManifest() {
    return fetch('images/manifest.json')
      .then((response) => response.ok ? response.json() : {})
      .then((data) => {
        this.imageManifest = data || {};
      })
      .catch(() => {
        this.imageManifest = {};
      });
  }

  setupLightbox() {
    const carousel = document.querySelector('.carousel');
    if (!carousel) return;
    if (document.querySelector('.image-lightbox')) return; // 已存在，避免重複建立
    const overlay = document.createElement('div');
    overlay.className = 'image-lightbox hidden';
    overlay.innerHTML = `
            <div class="lightbox-backdrop"></div>
            <div class="lightbox-panel">
                <button type="button" class="lightbox-close" aria-label="關閉大圖">×</button>
                <img class="lightbox-img" alt="產品大圖預覽">
            </div>
        `;

    // append to body so the overlay isn't affected by ancestor transforms
    document.body.appendChild(overlay);
    this.lightbox = overlay;
    this.lightboxImage = overlay.querySelector('.lightbox-img');
    this.lightboxClose = overlay.querySelector('.lightbox-close');
    this.lightboxBackdrop = overlay.querySelector('.lightbox-backdrop');
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.lastPointer = null;

    this.lightboxClose.addEventListener('click', () => this.closeLightbox());
    this.lightboxBackdrop.addEventListener('click', () => this.closeLightbox());

    this.lightboxImage.addEventListener('wheel', (event) => this.onLightboxWheel(event), { passive: false });
    this.lightboxImage.addEventListener('pointerdown', (event) => this.onLightboxPointerDown(event));
    window.addEventListener('pointermove', (event) => this.onLightboxPointerMove(event));
    window.addEventListener('pointerup', () => this.onLightboxPointerUp());
    this.lightboxImage.addEventListener('dblclick', () => this.resetLightboxTransform());

    this.carouselInner.addEventListener('click', (event) => {
      const target = event.target.closest('.gallery-img');
      if (!target) return;
      event.preventDefault();
      const src = target.dataset.fullSrc || target.src;
      this.openLightbox(src, target.alt);
    });
  }

  onLightboxWheel(event) {
    if (!this.lightbox || this.lightbox.classList.contains('hidden')) return;
    event.preventDefault();
    const delta = Math.sign(event.deltaY) * -0.12;
    this.zoomLevel = Math.min(Math.max(this.zoomLevel + delta, 1), 3);
    if (this.zoomLevel === 1) {
      this.panX = 0;
      this.panY = 0;
    }
    this.applyLightboxTransform();
  }

  onLightboxPointerDown(event) {
    if (!this.lightbox || this.lightbox.classList.contains('hidden')) return;
    if (this.zoomLevel <= 1) return;
    this.isPanning = true;
    this.lastPointer = { x: event.clientX, y: event.clientY };
    this.lightboxImage.setPointerCapture(event.pointerId);
    this.lightboxImage.classList.add('zoomed');
  }

  onLightboxPointerMove(event) {
    if (!this.isPanning || !this.lastPointer) return;
    event.preventDefault();
    const dx = event.clientX - this.lastPointer.x;
    const dy = event.clientY - this.lastPointer.y;
    this.panX += dx;
    this.panY += dy;
    this.lastPointer = { x: event.clientX, y: event.clientY };
    this.applyLightboxTransform();
  }

  onLightboxPointerUp() {
    if (!this.isPanning) return;
    this.isPanning = false;
    this.lightboxImage.classList.remove('zoomed');
    this.lastPointer = null;
  }

  applyLightboxTransform() {
    if (!this.lightboxImage) return;
    this.lightboxImage.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
  }

  resetLightboxTransform() {
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;
    if (this.lightboxImage) {
      this.lightboxImage.style.transform = 'translate(0, 0) scale(1)';
    }
  }

  openLightbox(src, alt) {
    if (!src) return;
    this.resetLightboxTransform();
    // prepare srcset for large display (900 / 1400) and wrap existing img in <picture>
    const orig = src;
    const extMatch = orig.match(/\.(jpe?g|png|webp)$/i);
    const origExt = extMatch ? extMatch[0] : '.jpg';
    const stem = orig.replace(/(-520|-900|-1400)?\.(jpe?g|png|webp)$/i, '');
    const webp900 = `${stem}-900.webp`;
    const webp1400 = `${stem}-1400.webp`;
    const fallbackOriginal = `${stem}${origExt}`;

    // if the current img is not already inside a <picture>, move it into one
    const currentImg = this.lightboxImage;
    if (currentImg) {
      if (!currentImg.parentElement || currentImg.parentElement.tagName.toLowerCase() !== 'picture') {
        const picture = document.createElement('picture');
        const source = document.createElement('source');
        source.type = 'image/webp';
        source.srcset = `${webp900} 900w, ${webp1400} 1400w`;
        source.sizes = '(max-width: 900px) 900px, 1400px';
        // replace img in DOM with picture and append source + img into picture
        currentImg.parentNode.replaceChild(picture, currentImg);
        picture.appendChild(source);
        picture.appendChild(currentImg);
      } else {
        // already wrapped: update source element
        const picture = currentImg.parentElement;
        let source = picture.querySelector('source[type="image/webp"]');
        if (!source) {
          source = document.createElement('source');
          source.type = 'image/webp';
          picture.insertBefore(source, currentImg);
        }
        source.srcset = `${webp900} 900w, ${webp1400} 1400w`;
        source.sizes = '(max-width: 900px) 900px, 1400px';
      }

      // set the img to load the large WebP by default; fallback handler will restore orig
      try {
        currentImg.srcset = `${webp900} 900w, ${webp1400} 1400w`;
        currentImg.sizes = '(max-width: 900px) 900px, 1400px';
        currentImg.src = webp1400;
      } catch (e) {
        currentImg.src = orig;
      }

      currentImg.alt = alt || '產品大圖';
      currentImg.onerror = () => {
        if (currentImg.src && currentImg.src.indexOf('-1400.webp') !== -1) {
          currentImg.onerror = null;
          currentImg.src = fallbackOriginal;
        } else {
          currentImg.onerror = null;
        }
      };
    }
    this.lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    if (!this.lightbox) return;
    this.lightbox.classList.add('hidden');
    document.body.style.overflow = '';
  }

  shuffleArray(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  updateDots() {
    if (!this.dotsContainer) return;

    const realIndex = ((this.currentPos - 1 + this.totalItems) % this.totalItems);
    this.dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, index) => {
      dot.classList.toggle('is-active', index === realIndex);
      dot.setAttribute('aria-current', index === realIndex ? 'true' : 'false');
    });
  }
}

// ========== 頁面加載完成 ==========
document.addEventListener('DOMContentLoaded', () => {
  // console.log("DOM 已就緒，開始初始化...");

  // 1. 初始化 Lottie
  try {
    setupLottieMood();
  } catch (e) {
    console.error("Lottie 初始化失敗:", e);
  }

  // 2. 初始化圖片加載
  try {
    initProductImageLoading();
  } catch (e) {
    console.error("圖片加載初始化失敗:", e);
  }

  // 在外面宣告全域變數（不要加 const/let 在裡面）
  let carousel;

  // 3. 初始化輪播 (確保只在這裡呼叫一次！)
  try {
    const carouselInner = document.querySelector('.carousel-inner');
    if (carouselInner) {
      // 💡 修正：把實例賦值給全域變數 carousel
      carousel = new ProductCarousel();
      // console.log("輪播初始化成功");
    }
  } catch (e) {
    console.error("輪播初始化失敗:", e);
  }

  // 4. 其他 UI 設置
  const container = document.querySelector('.scroll-container');
  if (container) {
    container.addEventListener('wheel', (e) => {
      // 不阻止默認行為，讓瀏覽器自然滾動
    }, { passive: true });
  }

  setupSectionReveal();
  setupCursorGlow();
  setupCardTilt();
  setupBackgroundElements();
  setupStoreDetails();
  setupProductLightbox();

  // 5. 防止右鍵與圖片拖曳
  document.addEventListener('contextmenu', (e) => e.preventDefault(), false);
  document.querySelectorAll('img').forEach(img => img.setAttribute('draggable', 'false'));
  document.querySelectorAll('dotlottie-player').forEach(player => player.setAttribute('draggable', 'false'));
});

// 全局加載控制
window.addEventListener("load", () => {
  const allImages = document.querySelectorAll('img');
  // console.log(`已加載 ${allImages.length} 張圖片`);

  setTimeout(() => {
    const loader = document.getElementById("loader-wrapper");
    if (loader) loader.classList.add("hidden");
  }, 500);
});

function setupBackgroundElements() {
  if (document.querySelector('.background-elements')) return;

  const layer = document.createElement('div');
  layer.className = 'background-elements';
  layer.setAttribute('aria-hidden', 'true');
  document.body.prepend(layer);
}

// Insert <picture> backgrounds into specific card types (idempotent)
function setupCardBackgrounds() {
  const makePictureFor = (basePath) => {
    const picture = document.createElement('picture');
    picture.className = 'card-bg';
    picture.setAttribute('aria-hidden', 'true');

    const source = document.createElement('source');
    source.type = 'image/webp';
    source.srcset = `${basePath}-520.webp 520w, ${basePath}-900.webp 900w, ${basePath}-1400.webp 1400w`;
    // sizes will be updated per-element when inserted
    source.sizes = '100vw';
    picture.appendChild(source);

    const img = document.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = `${basePath}-1400.webp`;
    picture.appendChild(img);

    return picture;
  };

}

// ========== 店舖詳情模態控制 ==========
function setupStoreDetails() {
  const storeImages = {
    'taidao': 'images/tiedao.jpg',
    'douhua': 'images/douhua.jpg',
    'nongzhai': 'images/nongzhai.jpg',
    'youce': 'images/youce.jpg',
    'gaoxiong': 'images/sanluzhiyi.jpg',
    'japan': 'images/lutai.jpg'
  };

  const modal = document.getElementById('storeDetailModal');
  if (!modal) return;

  const modalImage = modal.querySelector('.store-detail-img');
  const closeBtn = modal.querySelector('.store-detail-close');
  const backdrop = modal.querySelector('.store-detail-backdrop');

  const openModal = (imgSrc) => {
    if (modalImage && imgSrc) {
      modalImage.src = imgSrc;
      modalImage.alt = '店舖詳情圖片';
    }
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    modalImage.style.transform = 'translate(0, 0) scale(1)';
  };

  // 按鈕開啟
  document.querySelectorAll('.store-detail-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const storeKey = btn.getAttribute('data-store');
      const imgSrc = storeImages[storeKey];
      if (imgSrc) {
        openModal(imgSrc);
      }
    });
  });

  // 點擊遮罩或關閉按鈕關閉
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  // ESC 關閉
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
  });

  // 彈出層中的縮放功能
  let zoomLevel = 1;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let lastPointer = null;

  if (modalImage) {
    modalImage.addEventListener('wheel', (event) => {
      if (modal.classList.contains('hidden')) return;
      event.preventDefault();
      const delta = Math.sign(event.deltaY) * -0.12;
      zoomLevel = Math.min(Math.max(zoomLevel + delta, 1), 3);
      if (zoomLevel === 1) {
        panX = 0;
        panY = 0;
      }
      modalImage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    }, { passive: false });

    modalImage.addEventListener('pointerdown', (event) => {
      if (modal.classList.contains('hidden') || zoomLevel <= 1) return;
      isPanning = true;
      lastPointer = { x: event.clientX, y: event.clientY };
      modalImage.setPointerCapture(event.pointerId);
      modalImage.classList.add('zoomed');
    });

    window.addEventListener('pointermove', (event) => {
      if (!isPanning || !lastPointer) return;
      event.preventDefault();
      const dx = event.clientX - lastPointer.x;
      const dy = event.clientY - lastPointer.y;
      panX += dx;
      panY += dy;
      lastPointer = { x: event.clientX, y: event.clientY };
      modalImage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    });

    window.addEventListener('pointerup', () => {
      if (!isPanning) return;
      isPanning = false;
      modalImage.classList.remove('zoomed');
      lastPointer = null;
    });

    modalImage.addEventListener('dblclick', () => {
      zoomLevel = 1;
      panX = 0;
      panY = 0;
      modalImage.style.transform = 'translate(0, 0) scale(1)';
    });
  }
}

// ========== 產品圖片放大功能 ==========
function setupProductLightbox() {
  const lightbox = document.getElementById('productLightbox');
  if (!lightbox) return;

  const lightboxImg = lightbox.querySelector('.product-lightbox-img');
  const closeBtn = lightbox.querySelector('.product-lightbox-close');
  const backdrop = lightbox.querySelector('.product-lightbox-backdrop');

  const openLightbox = (imgSrc) => {
    if (lightboxImg && imgSrc) {
      lightboxImg.src = imgSrc;
      lightboxImg.alt = '產品放大圖片';
    }
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
    lightboxImg.style.transform = 'translate(0, 0) scale(1)';
  };

  // 產品圖片點擊開啟
  document.querySelectorAll('.product-img-clickable').forEach((img) => {
    img.addEventListener('click', (e) => {
      e.preventDefault();
      const imgSrc = img.src;
      if (imgSrc) {
        openLightbox(imgSrc);
      }
    });
  });

  // 點擊遮罩或關閉按鈕關閉
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (backdrop) backdrop.addEventListener('click', closeLightbox);

  // ESC 關閉
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) closeLightbox();
  });

  // 產品圖片縮放功能
  let zoomLevel = 1;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let lastPointer = null;

  if (lightboxImg) {
    lightboxImg.addEventListener('wheel', (event) => {
      if (lightbox.classList.contains('hidden')) return;
      event.preventDefault();
      const delta = Math.sign(event.deltaY) * -0.12;
      zoomLevel = Math.min(Math.max(zoomLevel + delta, 1), 3);
      if (zoomLevel === 1) {
        panX = 0;
        panY = 0;
      }
      lightboxImg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    }, { passive: false });

    lightboxImg.addEventListener('pointerdown', (event) => {
      if (lightbox.classList.contains('hidden') || zoomLevel <= 1) return;
      isPanning = true;
      lastPointer = { x: event.clientX, y: event.clientY };
      lightboxImg.setPointerCapture(event.pointerId);
      lightboxImg.classList.add('zoomed');
    });

    window.addEventListener('pointermove', (event) => {
      if (!isPanning || !lastPointer) return;
      event.preventDefault();
      const dx = event.clientX - lastPointer.x;
      const dy = event.clientY - lastPointer.y;
      panX += dx;
      panY += dy;
      lastPointer = { x: event.clientX, y: event.clientY };
      lightboxImg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    });

    window.addEventListener('pointerup', () => {
      if (!isPanning) return;
      isPanning = false;
      lightboxImg.classList.remove('zoomed');
      lastPointer = null;
    });

    lightboxImg.addEventListener('dblclick', () => {
      zoomLevel = 1;
      panX = 0;
      panY = 0;
      lightboxImg.style.transform = 'translate(0, 0) scale(1)';
    });
  }
}

// ========== 響應式調整 ==========
window.addEventListener('resize', () => {
  // 如果 carousel 存在，且有 animateTo 方法，就讓它重新定位到當前位置
  if (typeof carousel !== 'undefined' && carousel) {
    if (typeof carousel.update === 'function') {
      carousel.update();
    } else if (typeof carousel.animateTo === 'function') {
      // 💡 替代方案：利用現有的 animateTo 重新對齊，並帶入當前位置
      carousel.animateTo(carousel.currentPos);
    }
  }
});

// ========== 頁面加載完成 ==========
window.addEventListener('load', () => {
  // 確保圖片都已加載
  const allImages = document.querySelectorAll('img');
  // console.log(`已加載 ${allImages.length} 張圖片`);
});

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
      const isVisible = rect.bottom > window.innerHeight * 0.18 && rect.top < window.innerHeight * 0.82;

      section.classList.toggle('is-visible', isVisible);

      if (distance < closestDistance) {
        closestDistance = distance;
        activeSection = section;
      }
    });

    railLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${activeSection.id}`);
    });

    ticking = false;
  };

  const requestActiveUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(setActiveSection);
  };

  setActiveSection();
  window.addEventListener('scroll', requestActiveUpdate, { passive: true });
  window.addEventListener('resize', requestActiveUpdate);

  const container = document.querySelector('.scroll-container');
  if (container) {
    container.addEventListener('scroll', requestActiveUpdate, { passive: true });
  }

  railLinks.forEach((link) => {
    link.addEventListener('click', () => {
      window.setTimeout(setActiveSection, 350);
    });
  });
}

function setupCursorGlow() {
  const glow = document.querySelector('.cursor-glow');
  if (!glow || window.matchMedia('(pointer: coarse)').matches) return;

  let currentX = window.innerWidth / 2;
  let currentY = window.innerHeight / 2;
  let targetX = currentX;
  let targetY = currentY;

  const moveGlow = () => {
    currentX += (targetX - currentX) * 0.16;
    currentY += (targetY - currentY) * 0.16;
    glow.style.transform = `translate3d(${currentX - 60}px, ${currentY - 60}px, 0)`;
    requestAnimationFrame(moveGlow);
  };

  window.addEventListener('pointermove', (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    glow.classList.add('is-visible');
  }, { passive: true });

  window.addEventListener('pointerleave', () => glow.classList.remove('is-visible'));
  moveGlow();
}

function setupCardTilt() {
  const cards = document.querySelectorAll('.store-card.active, .story-section');
  if (window.matchMedia('(pointer: coarse)').matches) return;

  cards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const offset = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      card.style.setProperty('--tilt-card', `${offset * 1.2}deg`);
    }, { passive: true });

    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--tilt-card');
    });
  });
}

// 確保函式定義完整且無語法錯誤
function setupLottieMood() {
  const players = document.querySelectorAll('dotlottie-player');

  players.forEach((player) => {
    const defaultSpeed = Number(player.getAttribute('speed')) || 1;

    player.addEventListener('mouseenter', () => {
      const targetSpeed = defaultSpeed * 1.25;
      if (typeof player.setSpeed === 'function') {
        player.setSpeed(targetSpeed);
      } else if (player.getLottie && player.getLottie()) {
        player.getLottie().setSpeed(targetSpeed);
      }
    });

    player.addEventListener('mouseleave', () => {
      if (typeof player.setSpeed === 'function') {
        player.setSpeed(defaultSpeed);
      } else if (player.getLottie && player.getLottie()) {
        player.getLottie().setSpeed(defaultSpeed);
      }
    });
  });
}


// 全局加載控制
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("loader-wrapper").classList.add("hidden");
  }, 500);
});

// 產品圖片動態生成、加載控制與錯誤處理
function initProductImageLoading() {
  const carouselItems = document.querySelectorAll('#products .carousel-item');
  if (carouselItems.length === 0) return;

  // 1. JS 產品資料包
  const productData = [
    {
      folder: 'city-postcards',
      name: '城市字繪系列明信片',
      images: ['hero-1400.webp', 'P4110704-1400.webp', 'P4110705-1400.webp']
    },
    {
      folder: 'heritage-postcards',
      name: '文化資產系列明信片',
      images: ['P5091815-1400.webp', 'P5091821-1400.webp', 'P5091824-1400.webp']
    },
    {
      folder: 'yinpiao-postcards',
      name: '銀票系列明信片',
      images: ['P4110788-1400.webp', 'P4110789-1400.webp', 'P4110790-1400.webp']
    },
    {
      folder: 'taiwan-stampbook',
      name: '台灣地圖字繪印章本',
      images: ['P4110693-1400.webp', 'P4110792-1400.webp', 'P4141138-1400.webp']
    },
    {
      folder: 'taiwan-travel-journal',
      name: '台灣旅行手帳本',
      images: ['P4291378-1400.webp', 'P4291379-1400.webp', 'P4291388-1400.webp']
    }
  ];

  carouselItems.forEach((item) => {
    // 🛠️ 核心修正：抓取當前欄位內的 <h3> 文字，拿它去 productData 裡面找符合的資料
    const itemTitle = item.querySelector('h3')?.textContent?.trim() || '';

    // 模糊比對：只要 <h3> 包含 JS 資料裡的 name（例如 "台灣地圖字繪印章本(御朱印亦可)" 也能對到 "台灣地圖字繪印章本"）
    const currentData = productData.find(p => itemTitle.includes(p.name));

    if (!currentData) {
      console.warn(`找不到品名對應的圖片資料: "${itemTitle}"`);
      return;
    }

    const folder = currentData.folder;
    const imageList = currentData.images;
    const productName = currentData.name;
    const isClickable = item.getAttribute('data-clickable') === 'true';

    // 找到該項目內的圖片容器
    const gallery = item.querySelector('.product-gallery');
    if (!folder || !imageList || !gallery) return;

    // 清空容器（防止重複初始化或 Clone 帶來的重複生成）
    gallery.innerHTML = '';

    // 2. 循環建立 img 標籤并綁定載入邏輯
    imageList.forEach((imgName, index) => {
      const img = document.createElement('img');

      // 加上時間戳記清除快取
      const cleanImgName = imgName.trim();
      img.src = `images/${folder}/${cleanImgName}?t=${Date.now()}`;

      img.draggable = false;
      img.setAttribute('draggable', 'false');
      img.alt = `${productName} ${index + 1}`;

      // 3. 根據設定加入對應的 class 與屬性
      if (isClickable) {
        img.className = 'gallery-img product-img product-img-clickable';
        img.setAttribute('data-product-name', productName);
      } else {
        img.className = 'gallery-img product-img';
      }

      const handleLoad = () => {
        img.classList.add('loaded');
      };

      img.onload = handleLoad;
      img.onerror = () => {
        console.error("圖片實體路徑加載失敗，請檢查路徑與檔名:", img.src);
        handleLoad();
      };

      // 4. 塞入網頁容器
      gallery.appendChild(img);

      // 5. 立即檢查快取狀態
      if (img.complete) handleLoad();
    });
  });
}


