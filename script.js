// ===== Firebase Configuration =====
const firebaseConfig = {
    apiKey: "AIzaSyDbfiyxguYrVDImh-nuhpIQMAnZaTHriTE",
    authDomain: "techblogg-c037d.firebaseapp.com",
    projectId: "techblogg-c037d",
    storageBucket: "techblogg-c037d.firebasestorage.app",
    messagingSenderId: "276823418099",
    appId: "1:276823418099:web:9d4d9f6264a13d4987c386",
    measurementId: "G-SZLY1FFNH8"
};

// ImgBB API Key
const IMGBB_API_KEY = 'cab73b2d0a2d10cb23efd40452a7fd68';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ===== DOM Elements =====
const body = document.body;
const heartsContainer = document.getElementById('heartsContainer');
const sparklesContainer = document.getElementById('sparklesContainer');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const themeButtons = document.querySelectorAll('.theme-btn');
const subtitle = document.getElementById('subtitle');
const loveMessage = document.getElementById('loveMessage');

// ===== State =====
let photos = [];
let currentPhotoIndex = 0;
let isUploading = false;

// ===== Passwords =====
const FIRST_PASSWORD = '05052025';
const SECRET_PASSWORD = 'berin';

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    const fakeBlog = document.getElementById('fakeBlog');
    const passwordModal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('passwordInput');
    const passwordSubmit = document.getElementById('passwordSubmit');
    const passwordError = document.getElementById('passwordError');
    const revealBtn = document.getElementById('revealBtn');

    const secretArchive = document.getElementById('secretArchive');
    const secretTrigger = document.getElementById('secretTrigger');
    const secretModal = document.getElementById('secretModal');
    const secretInput = document.getElementById('secretInput');
    const secretSubmit = document.getElementById('secretSubmit');
    const secretError = document.getElementById('secretError');

    const heartTransition = document.getElementById('heartTransition');
    const romanticContent = document.getElementById('romanticContent');

    // Step 1: Blog → Password Modal
    if (revealBtn) {
        revealBtn.addEventListener('click', () => {
            fakeBlog.classList.add('hiding');
            setTimeout(() => {
                fakeBlog.style.display = 'none';
                passwordModal.classList.add('active');
                passwordInput.focus();
            }, 800);
        });
    }

    // Step 2: First Password → Secret Archive
    function checkFirstPassword() {
        if (passwordInput.value === FIRST_PASSWORD) {
            passwordModal.classList.remove('active');
            document.title = '🔐 GİZLİ ARŞİV';
            secretArchive.style.display = 'block';
        } else {
            passwordError.classList.add('show');
            passwordInput.classList.add('error');
            passwordInput.value = '';
            setTimeout(() => {
                passwordError.classList.remove('show');
                passwordInput.classList.remove('error');
            }, 2000);
        }
    }

    if (passwordSubmit) {
        passwordSubmit.addEventListener('click', checkFirstPassword);
    }
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkFirstPassword();
        });
    }

    // Step 3: Secret Trigger → "Kimsin?" Modal
    if (secretTrigger) {
        secretTrigger.addEventListener('click', () => {
            secretModal.style.display = 'flex';
            secretInput.focus();
        });
    }

    // Step 4: Second Password → Heart Transition → Love Gallery
    function checkSecretPassword() {
        const inputValue = secretInput.value.toLowerCase().trim();
        if (inputValue === SECRET_PASSWORD) {
            secretModal.style.display = 'none';
            secretArchive.style.display = 'none';

            // Show heart transition
            heartTransition.classList.add('active');

            // After animation, show Love Gallery
            setTimeout(() => {
                heartTransition.classList.remove('active');
                heartTransition.style.display = 'none';
                document.title = '💕 Melih ❤️ Berin';
                romanticContent.style.display = 'block';

                // Initialize romantic content
                initTheme();
                createFloatingHearts();
                createSparkles();
                initEventListeners();
                loadPhotosFromFirebase();
            }, 2000);
        } else {
            secretError.classList.add('show');
            secretInput.classList.add('error');
            secretInput.value = '';
            setTimeout(() => {
                secretError.classList.remove('show');
                secretInput.classList.remove('error');
            }, 2000);
        }
    }

    if (secretSubmit) {
        secretSubmit.addEventListener('click', checkSecretPassword);
    }
    if (secretInput) {
        secretInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkSecretPassword();
        });
    }
});

// ===== Firebase Functions =====
function loadPhotosFromFirebase() {
    db.collection('photos').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        photos = [];
        snapshot.forEach((doc) => {
            photos.push({
                id: doc.id,
                ...doc.data()
            });
        });
        renderGallery();
    }, (error) => {
        console.error('Error loading photos:', error);
        renderGallery();
    });
}

// ===== ImgBB Upload Function =====
async function uploadToImgBB(file) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', IMGBB_API_KEY);

    const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();

    if (data.success) {
        return data.data.url;
    } else {
        throw new Error('Upload failed');
    }
}

async function uploadPhoto(file) {
    if (isUploading) return;
    isUploading = true;

    const uploadText = uploadArea.querySelector('.upload-text');
    const originalText = uploadText.textContent;
    uploadText.textContent = 'Yükleniyor... ⏳';

    try {
        const imageUrl = await uploadToImgBB(file);

        await db.collection('photos').add({
            src: imageUrl,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        uploadText.textContent = 'Yüklendi! ✅';
        setTimeout(() => {
            uploadText.textContent = originalText;
        }, 2000);

    } catch (error) {
        console.error('Upload error:', error);
        uploadText.textContent = 'Hata oluştu ❌';
        setTimeout(() => {
            uploadText.textContent = originalText;
        }, 2000);
    }

    isUploading = false;
}

async function deletePhoto(photoId) {
    try {
        await db.collection('photos').doc(photoId).delete();
    } catch (error) {
        console.error('Delete error:', error);
    }
}

// ===== Theme =====
function initTheme() {
    const savedTheme = localStorage.getItem('loveGalleryTheme') || 'romantic-red';
    body.dataset.theme = savedTheme;

    themeButtons.forEach(btn => {
        if (btn.dataset.theme === savedTheme) {
            btn.classList.add('active');
        }
    });
}

function setTheme(theme) {
    body.dataset.theme = theme;
    localStorage.setItem('loveGalleryTheme', theme);
    themeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

// ===== Floating Hearts =====
function createFloatingHearts() {
    const hearts = ['❤️', '💕', '💖', '💗', '💓', '💝', '💘', '💞'];

    function createHeart() {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        heart.style.left = Math.random() * 100 + '%';
        heart.style.fontSize = (15 + Math.random() * 20) + 'px';
        heart.style.animationDuration = (6 + Math.random() * 6) + 's';
        heart.style.animationDelay = Math.random() * 2 + 's';
        heartsContainer.appendChild(heart);

        setTimeout(() => heart.remove(), 14000);
    }

    for (let i = 0; i < 15; i++) {
        setTimeout(createHeart, i * 300);
    }

    setInterval(createHeart, 800);
}

// ===== Sparkles =====
function createSparkles() {
    function createSparkle() {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.top = Math.random() * 100 + '%';
        sparkle.style.animationDelay = Math.random() * 2 + 's';
        sparklesContainer.appendChild(sparkle);

        setTimeout(() => sparkle.remove(), 3000);
    }

    for (let i = 0; i < 20; i++) {
        setTimeout(createSparkle, i * 150);
    }

    setInterval(createSparkle, 300);
}

// ===== Event Listeners =====
function initEventListeners() {
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });

    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFiles);

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles({ target: { files: e.dataTransfer.files } });
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    lightboxPrev.addEventListener('click', showPrevPhoto);
    lightboxNext.addEventListener('click', showNextPhoto);

    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('active')) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') showPrevPhoto();
            if (e.key === 'ArrowRight') showNextPhoto();
        }
    });
}

// ===== File Handling =====
function handleFiles(e) {
    const files = Array.from(e.target.files);

    files.forEach(file => {
        if (!file.type.startsWith('image/')) return;
        uploadPhoto(file);
    });

    fileInput.value = '';
}

// ===== Gallery =====
function renderGallery() {
    if (photos.length === 0) {
        gallery.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">📸</div>
                <p class="empty-state-text">Henüz fotoğraf yok. Anılarınızı yükleyin!</p>
            </div>
        `;
        return;
    }

    gallery.innerHTML = photos.map((photo, index) => `
        <div class="gallery-item" data-index="${index}">
            <img src="${photo.src}" alt="Anı ${index + 1}" loading="lazy">
            <button class="delete-btn" data-id="${photo.id}" title="Sil">×</button>
        </div>
    `).join('');

    gallery.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                openLightbox(parseInt(item.dataset.index));
            }
        });
    });

    gallery.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) {
                deletePhoto(btn.dataset.id);
            }
        });
    });
}

// ===== Lightbox =====
function openLightbox(index) {
    currentPhotoIndex = index;
    lightboxImage.src = photos[index].src;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function showPrevPhoto() {
    currentPhotoIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
    lightboxImage.src = photos[currentPhotoIndex].src;
}

function showNextPhoto() {
    currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
    lightboxImage.src = photos[currentPhotoIndex].src;
}
