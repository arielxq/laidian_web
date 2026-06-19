// ========== 產品輪播 - 支持多個獨立Carousel ==========
class ProductCarousel {
  constructor(carouselElement) {
    this.carouselElement = carouselElement;
    this.carouselInner = carouselElement.querySelector('.carousel-inner');
    this.prevBtn = carouselElement.querySelector('.carousel-btn.prev');
    this.nextBtn = carouselElement.querySelector('.carousel-btn.next');
    this.dotsContainer = carouselElement.querySelector('.carousel-dots');

    this.originalItems = Array.from(this.carouselInner.querySelectorAll('.carousel-item'));
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
    // 【修改】點擊左右箭頭時，執行 pauseAutoplay() 後不再自動啟動 startAutoplay()，維持暫停狀態
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => { this.pauseAutoplay(); this.prev(); });
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => { this.pauseAutoplay(); this.next(); });

    this.carouselInner.addEventListener('transitionend', (e) => {
      if (e.target !== this.carouselInner) return;
      this.onTransitionEnd();
    });

    this.startAutoplay();
    this.carouselElement.addEventListener('mouseenter', () => this.pauseAutoplay());
    this.carouselElement.addEventListener('mouseleave', () => this.startAutoplay());
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
        // 【修改】點擊下方導覽點時亦保持暫停，不強制重啟自動播放
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
}

// ========== 初始化與 DOM 事件 ==========
// ========== 初始化與 DOM 事件 ==========
let carousels = [];

document.addEventListener('DOMContentLoaded', () => {
  try { setupLottieMood(); } catch (e) { console.error("Lottie 錯誤:", e); }
  try { initProductImageLoading(); } catch (e) { console.error("圖片加載錯誤:", e); }

  //  【重點修復區】動態監聽初始化輪播圖
  try {
    const carouselElements = document.querySelectorAll('.carousel');

    if (carouselElements.length > 0) {
      const carouselObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          try {
            // 尋找該 HTML 元素對應的 JS 實例
            let instance = carousels.find(c => c.carouselElement === entry.target);

            if (entry.isIntersecting) {
              // 當滑動到產品區域時
              if (!instance) {
                // 如果還沒有初始化過，此時才正式建立並啟動
                instance = new ProductCarousel(entry.target);
                carousels.push(instance);
              } else {
                // 如果之前初始化過，只是滑回來，就重新啟動自動播放
                instance.startAutoplay();
              }
            } else {
              // 當滑走、離開產品區域時，自動暫停以節省效能
              if (instance) {
                instance.pauseAutoplay();
              }
            }
          } catch (e) {
            // 捕捉在滾動、播放或暫停時可能產生的任何錯誤
            console.error("輪播動態執行錯誤:", e);
          }
        });
      }, {
        threshold: 0.1
      });

      // 讓觀察器去監聽網頁上所有的輪播圖元素
      carouselElements.forEach(el => {
        try {
          carouselObserver.observe(el);
        } catch (e) {
          console.error("輪播觀察器綁定失敗:", e);
        }
      });
    }
  } catch (e) {
    console.error("輪播初始化總體錯誤:", e);
  }

  // 其他元件初始化
  setupSectionReveal();
  setupCursorGlow();
  setupCardTilt();
  setupStoreDetails();
  setupProductLightbox();
  setupPurchaseButtons();

  // 防止右鍵與拖曳
  document.addEventListener('contextmenu', (e) => e.preventDefault(), false);
  document.querySelectorAll('img, dotlottie-player').forEach(el => el.setAttribute('draggable', 'false'));
});


// ========== 全局加載控制 (Loading 遮罩) ==========
window.addEventListener("load", hideLoader);
// 2.5 秒
setTimeout(hideLoader, 2500);

function hideLoader() {
  const loader = document.getElementById("loader-wrapper");
  if (loader) {
    // 同時加 class 並且用 JS 直接改寫 style 權重
    loader.classList.add("hidden");
    loader.style.display = "none";
  }
}

// ========== 響應式調整 ==========
window.addEventListener('resize', () => {
  carousels.forEach(carousel => {
    if (typeof carousel.animateTo === 'function') {
      carousel.animateTo(carousel.currentPos);
    }
  });
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

  document.addEventListener('mousemove', (e) => {
    currentX += (e.clientX - currentX) * 0.2;
    currentY += (e.clientY - currentY) * 0.2;
    glow.style.left = currentX + 'px';
    glow.style.top = currentY + 'px';
  }, { passive: true });
}

function setupCardTilt() {
  document.querySelectorAll('.store-card').forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--tilt-card', `${(((e.clientX - rect.left) / rect.width) - 0.5) * 2.4}deg`);
    }, { passive: true });
    card.addEventListener('pointerleave', () => card.style.removeProperty('--tilt-card'));
  });
}

function setupLottieMood() {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const player = entry.target;
        if (player.dataset.src) {
          player.setAttribute('src', player.dataset.src);
          player.removeAttribute('data-src');
        }
        obs.unobserve(player);
      }
    });
  }, { rootMargin: '200px' });

  document.querySelectorAll('dotlottie-player').forEach(player => {
    const defaultSpeed = Number(player.getAttribute('speed')) || 1;
    player.addEventListener('mouseenter', () => player.setSpeed?.(defaultSpeed * 1.25));
    player.addEventListener('mouseleave', () => player.setSpeed?.(defaultSpeed));

    if (!player.classList.contains('priority')) {
      if (player.getAttribute('src')) {
        player.dataset.src = player.getAttribute('src');
        player.removeAttribute('src');
      }
      observer.observe(player);
    }
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

function toggleLoader(show) {
  const loaderEl = document.getElementById('loader-container');
  if (loaderEl) {
    loaderEl.style.display = show ? 'flex' : 'none';
  }
}

// ========== 通用彈出層與縮放功能 ==========
function setupStoreDetails() {
  const storeImages = {
    'taidao': 'images/tiedao.webp',
    'douhua': 'images/douhua.webp',
    'nongzhai': 'images/nongzhai.webp',
    'youce': 'images/youce.webp',
    'gaoxiong': 'images/sanluzhiyi.webp',
    'japan': 'images/lutai.webp'
  };

  const modal = document.getElementById('storeDetailModal');
  const modalImage = modal?.querySelector('.store-detail-img');
  if (!modal || !modalImage) return;

  // 1. 打開詳情
  document.querySelectorAll('.store-detail-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      toggleLoader(true);

      modalImage.onload = () => { toggleLoader(false); };
      modalImage.src = storeImages[btn.getAttribute('data-store')] || '';
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  });

  // 2. 統一的關閉邏輯
  const closeModal = () => {
    modal.classList.add('hidden');
    modalImage.src = ''; // 釋放記憶體
    document.body.style.overflow = '';
  };

  const closeBtn = modal.querySelector('.store-detail-close');
  if (closeBtn) closeBtn.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });

  const backdrop = modal.querySelector('.store-detail-backdrop');
  if (backdrop) backdrop.addEventListener('click', closeModal);

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) { closeModal(); }
  });

  // 移動端手勢縮放
  setupMobilePinchZoom(modal, modalImage, closeBtn, backdrop);
} // <--- 確保這個結束的大括號有好好對齊 function

function setupProductLightbox() {
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
      toggleLoader(true);

      const tempImg = new Image();
      tempImg.src = e.target.src;
      tempImg.onload = () => {
        lightboxImg.src = tempImg.src;
        toggleLoader(false);
        lightbox.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // 【新增】點開大圖燈箱時，暫停所有輪播滾動
        carousels.forEach(carousel => carousel.pauseAutoplay());
      };
    }
  });

  setupMobilePinchZoom(lightbox, lightboxImg, lightbox.querySelector('.image-lightbox-close'), lightbox.querySelector('.image-lightbox-backdrop'));
}

// 燈箱與模態框關閉時可以選擇是否恢復播放，此處遵循「保持暫停」或「手動重啟」邏輯
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

  // --- Touch 事件：專門且只處理「雙指縮放」 ---
  img.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      isPinched = true;
      startDist = getDistance(e.touches[0], e.touches[1]);
      lastScale = scale;
    }
  }, { passive: false });

  img.addEventListener('touchmove', e => {
    if (e.touches.length === 2 && isPinched) {
      e.preventDefault(); // 阻止手機瀏覽器預設的雙指放大頁面行為
      scale = Math.min(Math.max(lastScale * (getDistance(e.touches[0], e.touches[1]) / startDist), 1), 4);
      updateTransform();
    }
  }, { passive: false });

  img.addEventListener('touchend', e => {
    if (e.touches.length < 2) isPinched = false;
    if (scale <= 1) {
      img.style.transform = 'translate(0px, 0px) scale(1)';
      translateX = 0;
      translateY = 0;
    }
  });

  // --- Wheel 事件：電腦滾輪縮放 ---
  img.addEventListener('wheel', e => {
    e.preventDefault();
    scale = Math.min(Math.max(scale + Math.sign(e.deltaY) * -0.12, 1), 4);
    if (scale === 1) { translateX = 0; translateY = 0; }
    updateTransform();
  }, { passive: false });

  // --- Pointer 事件：統一處理「電腦滑鼠拖曳」與「手機單指拖曳」 ---
  img.addEventListener('pointerdown', e => {
    // 只有在圖片被放大（scale > 1）且非雙指縮放狀態下，才允許單指/滑鼠拖曳
    if (scale > 1 && !isPinched) {
      isPanning = true;
      img.setPointerCapture(e.pointerId); // 鎖定指標，即使移出圖片範圍也能持續拖曳
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
    }
  });

  img.addEventListener('pointermove', e => {
    if (isPanning) {
      // 【重要】阻止手機端拖曳圖片時，整個網頁背景跟著滾動的預設行為
      if (e.cancelable) e.preventDefault();
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateTransform();
    }
  });

  img.addEventListener('pointerup', (e) => {
    if (isPanning) {
      isPanning = false;
      try { img.releasePointerCapture(e.pointerId); } catch (err) { }
    }
  });
  img.addEventListener('pointercancel', () => isPanning = false);

  // --- 其他通用關閉邏輯 ---
  img.addEventListener('dblclick', () => { scale = 1; translateX = 0; translateY = 0; updateTransform(); });

  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.classList.contains('hidden')) resetZoom(); });
  if (closeBtn) closeBtn.addEventListener('click', resetZoom);
  if (backdrop) backdrop.addEventListener('click', resetZoom);
}

// ========== 海外直購元件互動功能 (點擊展開子按鈕 + 網址跳轉) ==========
function setupPurchaseButtons() {
  // 1. 主按鈕點擊：控制展開/收合
  document.querySelectorAll('.theme-fab-main').forEach(mainBtn => {
    mainBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const fabContainer = mainBtn.closest('.products-fab');
      if (!fabContainer) return;

      const isExpanded = fabContainer.classList.toggle('is-expanded');

      if (isExpanded) {
        document.querySelectorAll('.products-fab').forEach(otherFab => {
          if (otherFab !== fabContainer) {
            otherFab.classList.remove('is-expanded');
          }
        });
        // 點擊主按鈕展開選單時暫停輪播
        carousels.forEach(carousel => carousel.pauseAutoplay());
      }
    });
  });

  // 2. 子按鈕點擊：讀取 data-url 並跳轉至結帳網頁
  document.querySelectorAll('.sub-btn').forEach(subBtn => {
    subBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // 【新增】點擊海外直購子按鈕（選單跳轉按鈕）時，同樣觸發暫停輪播
      carousels.forEach(carousel => carousel.pauseAutoplay());

      const url = subBtn.getAttribute('data-url');
      if (url && url !== '#' && url.trim() !== '') {
        window.open(url, '_blank');
      } else {
        console.warn('此按鈕尚未設定有效的 data-url 網址');
      }
    });
  });

  // 3. 防呆點擊：點擊網頁任意空白處時，自動收合所有直購選單
  document.addEventListener('click', () => {
    document.querySelectorAll('.products-fab').forEach(fab => {
      fab.classList.remove('is-expanded');
    });
  });
}