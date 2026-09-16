document.addEventListener('DOMContentLoaded', async () => {
    // 1. App Data Initialization
    try {
        const response = await fetch('/api/data');
        if (!response.ok) throw new Error('Failed to fetch site data');
        const data = await response.json();

        if (data.site) renderSiteInfo(data.site);
        if (data.trainers) renderTrainers(data.trainers);
        if (data.programs) renderPrograms(data.programs);
        if (data.pricing) renderPricing(data.pricing);
        if (data.schedule) renderSchedule(data.schedule);
        if (data.testimonials) renderTestimonials(data.testimonials);
    } catch (error) {
        console.error('Error initializing application data:', error);
    }

    // 2. Animated Login System Initialization
    initLoginAnimation();
});

/* ==========================================
   ANIMATED ADMIN LOGIN HANDLER
   ========================================== */
function initLoginAnimation() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const character = document.getElementById('character');
    const characterWrapper = document.getElementById('characterWrapper');
    const loginForm = document.getElementById('loginForm');
    const successBanner = document.getElementById('successBanner');

    // Safe execution check
    if (!usernameInput || !passwordInput || !character) return;

    // Focus state listeners
    usernameInput.addEventListener('focus', () => {
        character.classList.add('peek-down');
        character.classList.remove('look-away');
    });

    usernameInput.addEventListener('blur', () => {
        character.classList.remove('peek-down');
    });

    passwordInput.addEventListener('focus', () => {
        character.classList.add('look-away');
        character.classList.remove('peek-down');
    });

    passwordInput.addEventListener('blur', () => {
        character.classList.remove('look-away');
    });

    // Form Submit handling
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (characterWrapper) {
                characterWrapper.style.transform = 'translateY(-25px)';
            }
            
            setTimeout(() => {
                if (characterWrapper) characterWrapper.style.transform = 'translateY(0)';
                if (successBanner) successBanner.style.display = 'block';
            }, 300);
        });
    }
}

/* ==========================================
   SITE RENDERING ENGINE
   ========================================== */
function renderSiteInfo(site) {
    if (!site) return;
    setElementText('site-name', site.name);
    setElementText('site-tagline', site.tagline);
    setElementText('site-desc', site.description);
    setElementText('footer-phone', site.phone);
    setElementText('footer-email', site.email);
    setElementText('footer-address', site.address);
}

function renderTrainers(trainers = []) {
    const container = document.getElementById('trainers-container');
    if (!container) return;
    container.innerHTML = trainers.map(trainer => `
        <div class="trainer-card">
            <img src="${trainer.image || ''}" alt="${trainer.name || 'Trainer'}" loading="lazy">
            <h3>${trainer.name || ''}</h3>
            <span class="role">${trainer.role || ''}</span>
            <p>${trainer.bio || ''}</p>
        </div>
    `).join('');
}

function renderPrograms(programs = []) {
    const container = document.getElementById('programs-container');
    if (!container) return;
    container.innerHTML = programs.map(program => `
        <div class="program-card">
            <h3>${program.name || ''}</h3>
            <p>${program.description || ''}</p>
        </div>
    `).join('');
}

function renderPricing(pricing = []) {
    const container = document.getElementById('pricing-container');
    if (!container) return;
    container.innerHTML = pricing.map(plan => {
        const phone = plan.whatsapp || '1234567890';
        const featuresList = Array.isArray(plan.features) 
            ? plan.features.map(feature => `<li>${feature}</li>`).join('') 
            : '';

        return `
            <div class="pricing-card">
                <h3>${plan.title || 'Basic Plan'}</h3>
                <div class="price">${plan.price || '$0'}</div>
                <ul>${featuresList}</ul>
                <a href="https://wa.me/${phone}" class="card-choose-btn" target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.299.425 2.503 1.146 3.475l-.75 2.741 2.805-.736c.937.511 2.012.798 3.15.798 3.182 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.778-5.751-5.778z"/></svg>
                    Choose Plan
                </a>
            </div>
        `;
    }).join('');
}

function renderSchedule(schedule = []) {
    const container = document.getElementById('schedule-container');
    if (!container) return;
    container.innerHTML = schedule.map(item => `
        <div class="schedule-item">
            <span class="day">${item.day || ''}</span>
            <span class="time">${item.time || ''}</span>
            <span class="class-name">${item.className || ''}</span>
            <span class="coach">${item.coach || ''}</span>
        </div>
    `).join('');
}

function renderTestimonials(testimonials = []) {
    const container = document.getElementById('testimonials-container');
    if (!container) return;
    container.innerHTML = testimonials.map(item => `
        <div class="testimonial-card">
            <p>"${item.text || ''}"</p>
            <h4>- ${item.author || 'Anonymous'}</h4>
        </div>
    `).join('');
}

function setElementText(id, text) {
    const element = document.getElementById(id);
    if (element && text !== undefined) element.textContent = text;
}
