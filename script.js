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
        this.folderAliases = {
            'city-postcards': '城市字繪系列明信片',
            'cultural-assets': '文化資產系列明信片',
            'banknote-postcards': '銀票系列明信片',
            'taiwan-map-stamp-book': '台灣地圖字繪印章本',
            'taiwan-travel-journal': '台灣旅行手帳本'
        };

        this.imageManifest = {};
        this.currentPos = 1; // 1..totalItems 對應真實items

        this.loadManifest().then(() => {
            if (this.carouselInner && this.originalItems.length) {
                this.setupProductImages();
                this.setupLightbox();
                this.setupInfiniteClones();
                this.setupDots();
                this.init();
                this.updateDots();
            }
        });
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

        // 動畫結束後處理無縫跳轉
        this.carouselInner.addEventListener('transitionend', () => this.onTransitionEnd());

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
            dot.setAttribute('aria-label', `查看 ${item.querySelector('h3')?.textContent || `第 ${index + 1} 個產品`}`);
            dot.addEventListener('click', () => {
                if (this.isAnimating) return;
                this.pauseAutoplay();
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
            if (!folder) return;
            const fallbackFolder = this.folderAliases[folder];
            const imageNames = item.dataset.images ? item.dataset.images.split(',').map(name => name.trim()).filter(Boolean) : [];
            const manifestImages = this.imageManifest[folder] || [];
            const validImageNames = imageNames.filter((name) => manifestImages.includes(name));
            const candidates = validImageNames.length ? validImageNames : manifestImages.slice();
            if (!candidates.length) return;

            const shuffled = this.shuffleArray(candidates.slice());
            const galleryImages = item.querySelectorAll('.gallery-img');

            galleryImages.forEach((img, index) => {
                const candidateOrder = shuffled.slice(index).concat(shuffled.slice(0, index));
                this.assignProductImage(img, folder, candidateOrder, fallbackFolder);
            });
        });
    }

    assignProductImage(img, folder, candidates, fallbackFolder) {
        img.dataset.candidateIndex = '0';
        img.dataset.fallbackTried = 'false';
        img.dataset.currentFolder = folder;
        const imageName = candidates[0];
        if (!imageName) {
            img.style.display = 'none';
            return;
        }
        img.dataset.fullSrc = `images/${folder}/${imageName}`;
        img.src = img.dataset.fullSrc;
        img.onerror = () => this.handleProductImageError(img, candidates, fallbackFolder);
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

        const overlay = document.createElement('div');
        overlay.className = 'image-lightbox hidden';
        overlay.innerHTML = `
            <div class="lightbox-backdrop"></div>
            <div class="lightbox-panel">
                <button type="button" class="lightbox-close" aria-label="關閉大圖">×</button>
                <img class="lightbox-img" alt="產品大圖預覽">
            </div>
        `;

        carousel.appendChild(overlay);
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
        this.lightboxImage.src = src;
        this.lightboxImage.alt = alt || '產品大圖';
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

// 初始化輪播
const carousel = new ProductCarousel();

// ========== 頁面滾動監聽 ==========
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.scroll-container');
    if (!container) return;

    // 平滑滾動動效
    container.addEventListener('wheel', (e) => {
        // 不阻止默認行為，讓瀏覽器自然滾動
    }, { passive: true });

    setupSectionReveal();
    setupCursorGlow();
    setupCardTilt();
    setupLottieMood();
});

// ========== 響應式調整 ==========
window.addEventListener('resize', () => {
    if (carousel && carousel.update) {
        carousel.update();
    }
});

// ========== 頁面加載完成 ==========
window.addEventListener('load', () => {
    // 確保圖片都已加載
    const allImages = document.querySelectorAll('img');
    console.log(`已加載 ${allImages.length} 張圖片`);
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

function setupLottieMood() {
    const players = document.querySelectorAll('lottie-player');

    players.forEach((player) => {
        const defaultSpeed = Number(player.getAttribute('speed')) || 1;

        player.addEventListener('mouseenter', () => {
            if (player.setSpeed) player.setSpeed(defaultSpeed * 1.25);
        });

        player.addEventListener('mouseleave', () => {
            if (player.setSpeed) player.setSpeed(defaultSpeed);
        });
    });
}
