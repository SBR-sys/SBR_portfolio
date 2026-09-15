/* ==========================================================================
   SUMUKH B — PORTFOLIO SCRIPT
   Vanilla JS only. Every feature initializes independently (safeInit) so a
   failure or missing browser API in one block can never block the others,
   and never leaves page content hidden.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Runs fn in isolation; logs and moves on instead of halting the script. */
  function safeInit(label, fn) {
    try { fn(); }
    catch (err) { console.warn(`[portfolio] "${label}" failed to initialize:`, err); }
  }

  /* ------------------------------------------------------------------
     NAVBAR — shrink + blur on scroll
  ------------------------------------------------------------------ */
  const navbar = document.getElementById('navbar');

  safeInit('navbar scroll state', () => {
    const updateNavbar = () => navbar.classList.toggle('scrolled', window.scrollY > 24);
    updateNavbar();
    window.addEventListener('scroll', updateNavbar, { passive: true });
  });

  /* ------------------------------------------------------------------
     MOBILE MENU
  ------------------------------------------------------------------ */
  const menuToggle = document.getElementById('menuToggle');
  const navLinksEl = document.getElementById('navLinks');

  safeInit('mobile menu', () => {
    const closeMenu = () => {
      menuToggle.classList.remove('open');
      navLinksEl.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    };

    menuToggle.addEventListener('click', () => {
      const isOpen = navLinksEl.classList.toggle('open');
      menuToggle.classList.toggle('open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinksEl.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  });

  /* ------------------------------------------------------------------
     ACTIVE NAV LINK ON SCROLL (progressively enhanced; skipped quietly
     if IntersectionObserver isn't available)
  ------------------------------------------------------------------ */
  safeInit('active nav link tracking', () => {
    if (!('IntersectionObserver' in window)) return;

    const sections = document.querySelectorAll('main section[id]');
    const navLinkMap = new Map();
    navLinksEl.querySelectorAll('.nav-link').forEach(link => {
      navLinkMap.set(link.getAttribute('href').replace('#', ''), link);
    });

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinkMap.forEach(link => link.classList.remove('active-link'));
          const activeLink = navLinkMap.get(entry.target.id);
          if (activeLink) activeLink.classList.add('active-link');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    sections.forEach(section => sectionObserver.observe(section));
  });

  /* ------------------------------------------------------------------
     TYPING ANIMATION
  ------------------------------------------------------------------ */
  safeInit('typing animation', () => {
    const typedEl = document.getElementById('typedText');
    if (!typedEl) return;

    const roles = ['Software Engineer', 'Backend Developer', 'AI Enthusiast', 'Computer Vision Developer'];

    if (prefersReducedMotion) {
      typedEl.textContent = roles[0];
      return;
    }

    let roleIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const TYPE_SPEED = 65;
    const DELETE_SPEED = 35;
    const HOLD_TIME = 1500;

    const tick = () => {
      const currentRole = roles[roleIndex];

      if (!deleting) {
        charIndex++;
        typedEl.textContent = currentRole.slice(0, charIndex);
        if (charIndex === currentRole.length) {
          deleting = true;
          setTimeout(tick, HOLD_TIME);
          return;
        }
        setTimeout(tick, TYPE_SPEED);
      } else {
        charIndex--;
        typedEl.textContent = currentRole.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
        }
        setTimeout(tick, DELETE_SPEED);
      }
    };

    setTimeout(tick, 500);
  });

  /* ------------------------------------------------------------------
     SCROLL REVEAL (fade-up)
     Content is visible by default (see CSS). Once IntersectionObserver
     is confirmed available, elements fade in every time they enter the
     viewport and fade back out when they leave — replays on every pass,
     scrolling down or back up.
  ------------------------------------------------------------------ */
  safeInit('scroll reveal', () => {
    const revealEls = document.querySelectorAll('[data-reveal]');
    if (!revealEls.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      return; // elements remain visible via default CSS — nothing to do
    }

    document.documentElement.classList.add('reveal-ready');

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.classList.toggle('revealed', entry.isIntersecting);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i % 4, 3) * 80}ms`;
      revealObserver.observe(el);
    });
  });

  /* ------------------------------------------------------------------
     HERO VISUAL — subtle parallax on pointer move (desktop hover only)
  ------------------------------------------------------------------ */
  safeInit('hero parallax', () => {
    const heroEl = document.querySelector('.hero');
    const visualStage = document.getElementById('visualStage');
    if (!heroEl || !visualStage || prefersReducedMotion) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    let rafId = null;
    visualStage.style.transition = 'transform 0.3s ease-out';
    visualStage.style.transformStyle = 'preserve-3d';

    heroEl.addEventListener('mousemove', (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = visualStage.getBoundingClientRect();
        const relX = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const relY = (e.clientY - rect.top - rect.height / 2) / rect.height;
        visualStage.style.transform = `rotateY(${relX * 6}deg) rotateX(${-relY * 6}deg)`;
      });
    });

    heroEl.addEventListener('mouseleave', () => {
      visualStage.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });
  });

  /* ------------------------------------------------------------------
     HERO ENTRANCE — staggered fade-up sequence on page load.
     The hidden starting state (.hero-ready) is set synchronously in an
     inline <head> script, before first paint, so there's no flash of
     visible-then-hidden content. This block only adds .hero-entered,
     via a double rAF so the browser is guaranteed to have painted the
     hidden state on at least one frame before the transition-in starts.
  ------------------------------------------------------------------ */
  safeInit('hero entrance', () => {
    if (prefersReducedMotion) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.add('hero-entered');
      });
    });
  });

  /* ------------------------------------------------------------------
     CARD CURSOR GLOW — soft light that follows the pointer across
     projects, about, skills, and education cards. Desktop pointer
     devices only; skipped on touch and reduced motion.
  ------------------------------------------------------------------ */
  safeInit('card cursor glow', () => {
    if (prefersReducedMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const glowCards = document.querySelectorAll('.flagship-project, .project-card, .about-card, .stat-card, .skill-card, .education-card, .experience-card');
    if (!glowCards.length) return;

    glowCards.forEach(card => {
      let rafId = null;
      card.addEventListener('mousemove', (e) => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
          card.style.setProperty('--my', `${e.clientY - rect.top}px`);
          rafId = null;
        });
      });
    });
  });

  /* ------------------------------------------------------------------
     PROJECT DETAILS MODAL
  ------------------------------------------------------------------ */
  safeInit('project modal', () => {
    const overlay = document.getElementById('projectModal');
    const dialog = overlay ? overlay.querySelector('.modal-dialog') : null;
    const body = document.getElementById('modalBody');
    const closeBtn = document.getElementById('modalClose');
    const triggers = document.querySelectorAll('[data-modal-open]');
    if (!overlay || !body || !closeBtn || !triggers.length) return;

    const modalContent = {
      framesense: {
        kind: 'project',
        tag: 'Flagship Project',
        title: 'FrameSense — AI-Powered FPS Game Performance Analyzer',
        meta: 'April 2025 — Present',
        paragraphs: [
          'Developed a web-based AI application that leverages YOLOv8 and computer vision to analyze FPS gameplay in real time, providing performance insights through an interactive dashboard powered by FastAPI.',
          'The pipeline processes gameplay footage frame by frame, running a fine-tuned YOLOv8 model to detect in-game objects and surface metrics like FPS, detection confidence, and object counts, all served through a FastAPI REST backend.'
        ],
        stack: ['Python', 'YOLOv8', 'OpenCV', 'FastAPI', 'HTML', 'CSS', 'JavaScript'],
        highlights: [
          'Real-time gameplay analysis',
          'Fine-tuned YOLOv8 model',
          'Computer vision powered analytics',
          'FastAPI REST backend',
          'Interactive dashboard'
        ],
        screenshots: [
          { src: 'framesense-landing.png', alt: 'FrameSense landing page — Elevate Your FPS Skills', caption: 'Landing page' },
          { src: 'framesense-upload.png', alt: 'FrameSense upload and analyze screen with detection options', caption: 'Upload & Analyze' },
          { src: 'framesense-dashboard.png', alt: 'FrameSense player performance dashboard with aim analytics', caption: 'Player Performance dashboard' }
        ]
      },
      gamingcafe: {
        kind: 'project',
        tag: 'Project',
        title: 'Gaming Café Management System',
        meta: null,
        paragraphs: [
          'Developed a full-stack web application to streamline gaming café operations, including customer bookings, system allocation, user management, and billing, through a FastAPI backend and MySQL database.'
        ],
        stack: ['Python', 'FastAPI', 'MySQL', 'HTML', 'CSS'],
        highlights: [
          'Customer booking management',
          'System allocation tracking',
          'User management',
          'Billing and invoicing',
          'Relational database schema on MySQL'
        ],
        screenshots: [
          { src: 'gamingcafe-landing.png', alt: 'Mystic Arcade landing page — gaming café management system', caption: 'Landing page' },
          { src: 'gamingcafe-booking.png', alt: 'Mystic Arcade booking form for selecting a game, date, time slot, and duration', caption: 'Book a session' },
          { src: 'gamingcafe-gamelibrary.png', alt: 'Mystic Arcade game library with titles like Call of Duty: Warzone, Counter-Strike, and Cyberpunk 2077', caption: 'Game library' }
        ]
      },
      bloodbank: {
        kind: 'project',
        tag: 'Full Stack Web Development',
        title: 'Blood Bank Management System',
        meta: null,
        paragraphs: [
          'A role-based blood bank management platform that manages blood inventory, donations, hospital requests, and fulfillment while tracking availability, expiry, and storage conditions.',
          'Connects the complete workflow from donation to inventory management and hospital blood request fulfillment — with separate Admin, Coordinator, and Nurse roles, expiry and availability validation, and blood storage temperature monitoring built in.'
        ],
        stack: ['PHP', 'MySQL', 'HTML', 'CSS', 'JavaScript', 'XAMPP'],
        highlights: [
          'Role-based access control (Admin, Coordinator, Nurse)',
          'Blood inventory management',
          'Hospital request fulfillment',
          'Expiry & availability validation',
          'Blood storage temperature monitoring',
          'Dashboard analytics'
        ],
        screenshots: [
          { src: 'bloodbank-admin.png', alt: 'Blood Bank Management System admin dashboard with donor, hospital, and inventory stats', caption: 'Admin dashboard' },
          { src: 'bloodbank-coordinator.png', alt: 'Blood Bank Management System coordinator dashboard view', caption: 'Coordinator dashboard' },
          { src: 'bloodbank-nurse.png', alt: 'Blood Bank Management System nurse dashboard view', caption: 'Nurse dashboard' },
          { src: 'bloodbank-inventory.png', alt: 'Blood Bank Management System inventory page with search, filters, and expiry tracking', caption: 'Inventory & expiry tracking' },
          { src: 'bloodbank-requests.png', alt: 'Blood Bank Management System hospital blood requests page with status and priority', caption: 'Hospital requests' }
        ]
      },
      portfolio: {
        kind: 'project',
        tag: 'Project',
        title: 'This Portfolio Website',
        meta: null,
        paragraphs: [
          'Designed and built this site from scratch using vanilla HTML, CSS, and JavaScript — no frameworks or UI libraries. Focused on a clean, premium dark UI in the spirit of GitHub, Linear, and Vercel, with hand-built interactive components rather than off-the-shelf widgets.',
          'Includes a typing hero animation, scroll-reveal transitions, a sticky blurred navbar, custom image galleries and modals for projects and certificates, client-side form validation, and a fully responsive layout tuned separately for desktop, tablet, and mobile.'
        ],
        stack: ['HTML', 'CSS', 'JavaScript'],
        highlights: [
          'No frameworks — hand-written HTML, CSS, and JS',
          'Custom modal and gallery components',
          'Scroll-based reveal animations',
          'Fully responsive across breakpoints',
          'Accessible: keyboard nav, focus states, reduced-motion support'
        ],
        screenshots: [
          { src: 'portfolio-hero.png', alt: 'Portfolio homepage hero section with typing animation and photo', caption: 'Hero section' },
          { src: 'portfolio-skills.png', alt: 'Portfolio technical skills section with categorized skill cards', caption: 'Skills section' },
          { src: 'portfolio-leadership.png', alt: 'Portfolio leadership and qualities section', caption: 'Leadership section' }
        ]
      },
      'expo-cert': {
        kind: 'cert-single',
        tag: 'Achievement',
        title: 'Mini Project Expo 2026 — 3rd Prize',
        meta: 'Maharaja Institute of Technology, Mysore · Dept. of Computer Engineering · 14 January 2026',
        image: 'cert-expo.jpg',
        imageAlt: 'Certificate: Mini Project Expo 2026, 3rd Prize, awarded to Sumukh B',
        paragraphs: [
          'Presented FrameSense, an AI-powered FPS gameplay analyzer using YOLOv8, OpenCV, and FastAPI to extract and visualize gameplay performance insights.'
        ]
      },
      'coursera-certs': {
        kind: 'cert-gallery',
        tag: 'Certifications',
        title: 'Coursera Certifications',
        paragraphs: [
          'Course certificates completed and independently verifiable on Coursera.'
        ],
        items: [
          { course: 'The Full Stack', issuer: 'Meta', type: 'Course Certificate', date: 'May 25, 2026', verifyUrl: 'https://coursera.org/verify/541YKREC8GKS', image: 'cert-meta.jpg' },
          { course: 'Machine Learning with Python', issuer: 'IBM', type: 'Course Certificate', date: 'May 11, 2026', verifyUrl: 'https://coursera.org/verify/T0YNINVKB19W', image: 'cert-ibm.jpg' },
          { course: 'Introduction to AI', issuer: 'Google', type: 'Course Certificate', date: 'Apr 9, 2026', verifyUrl: 'https://coursera.org/verify/4TIA8QRDG8XG', image: 'cert-google.jpg' },
          { course: 'Web Development in React.js: Development Basics', issuer: 'Coursera Project Network', type: 'Project Certificate', date: 'Nov 26, 2025', verifyUrl: 'https://coursera.org/verify/LGRUXFHVGHT1', image: 'cert-react.jpg' }
        ]
      }
    };

    let lastFocused = null;

    const initGallery = (root, items, onChange) => {
      if (!root) return;
      const track = root.querySelector('.gallery-track');
      const prevBtn = root.querySelector('.gallery-prev');
      const nextBtn = root.querySelector('.gallery-next');
      const dots = Array.from(root.querySelectorAll('.gallery-dot'));
      const caption = root.querySelector('.gallery-caption');
      let index = 0;

      const update = () => {
        track.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === index));
        if (caption) caption.textContent = items[index].caption;
        if (typeof onChange === 'function') onChange(items[index], index);
      };

      if (prevBtn) prevBtn.addEventListener('click', () => {
        index = (index - 1 + items.length) % items.length;
        update();
      });
      if (nextBtn) nextBtn.addEventListener('click', () => {
        index = (index + 1) % items.length;
        update();
      });
      dots.forEach(dot => dot.addEventListener('click', () => {
        index = Number(dot.dataset.slide);
        update();
      }));

      update();
    };

    const renderProject = (data) => {
      const metaHtml = data.meta ? `<p class="modal-meta">${data.meta}</p>` : '';
      const paraHtml = data.paragraphs.map(p => `<p>${p}</p>`).join('');
      const stackHtml = data.stack.map(s => `<span class="badge">${s}</span>`).join('');
      const highlightHtml = data.highlights.map(h => `<li>${h}</li>`).join('');

      const shots = data.screenshots || [];
      const galleryHtml = shots.length ? `
        <div class="modal-gallery" data-gallery>
          <div class="gallery-frame">
            <div class="gallery-track">
              ${shots.map(s => `<a href="${s.src}" target="_blank" rel="noopener" aria-label="Open full-size screenshot: ${s.caption}"><img src="${s.src}" alt="${s.alt}" class="gallery-img"></a>`).join('')}
            </div>
            ${shots.length > 1 ? `
            <button type="button" class="gallery-nav gallery-prev" aria-label="Previous screenshot">&#8249;</button>
            <button type="button" class="gallery-nav gallery-next" aria-label="Next screenshot">&#8250;</button>
            ` : ''}
          </div>
          <div class="gallery-footer">
            <p class="gallery-caption">${shots[0].caption}</p>
            ${shots.length > 1 ? `
            <div class="gallery-dots">
              ${shots.map((_, i) => `<button type="button" class="gallery-dot${i === 0 ? ' active' : ''}" data-slide="${i}" aria-label="Screenshot ${i + 1}"></button>`).join('')}
            </div>` : ''}
          </div>
        </div>
      ` : '';

      body.innerHTML = `
        <span class="project-tag">${data.tag}</span>
        <h2 id="modalTitle">${data.title}</h2>
        ${metaHtml}
        ${paraHtml}
        ${galleryHtml}
        <h3>Tech Stack</h3>
        <div class="badge-row">${stackHtml}</div>
        <h3>Highlights</h3>
        <ul class="highlight-list">${highlightHtml}</ul>
      `;

      if (shots.length) initGallery(body.querySelector('[data-gallery]'), shots);
    };

    const renderCertSingle = (data) => {
      const paraHtml = data.paragraphs.map(p => `<p>${p}</p>`).join('');
      body.innerHTML = `
        <span class="project-tag">${data.tag}</span>
        <h2 id="modalTitle">${data.title}</h2>
        <p class="modal-meta">${data.meta}</p>
        <div class="cert-image-frame">
          <img src="${data.image}" alt="${data.imageAlt}" class="cert-image">
        </div>
        ${paraHtml}
      `;
    };

    const renderCertGallery = (data) => {
      const items = data.items;
      const paraHtml = data.paragraphs.map(p => `<p>${p}</p>`).join('');
      const galleryItems = items.map(it => ({ ...it, caption: it.course }));

      body.innerHTML = `
        <span class="project-tag">${data.tag}</span>
        <h2 id="modalTitle">${data.title}</h2>
        ${paraHtml}
        <div class="modal-gallery" data-gallery>
          <div class="gallery-frame">
            <div class="gallery-track">
              ${items.map(it => `<a href="${it.image}" target="_blank" rel="noopener" aria-label="Open full-size certificate: ${it.course}"><img src="${it.image}" alt="${it.course} certificate, issued by ${it.issuer}" class="gallery-img"></a>`).join('')}
            </div>
            <button type="button" class="gallery-nav gallery-prev" aria-label="Previous certificate">&#8249;</button>
            <button type="button" class="gallery-nav gallery-next" aria-label="Next certificate">&#8250;</button>
          </div>
          <div class="gallery-footer">
            <p class="gallery-caption">${items[0].course}</p>
            <div class="gallery-dots">
              ${items.map((_, i) => `<button type="button" class="gallery-dot${i === 0 ? ' active' : ''}" data-slide="${i}" aria-label="Certificate ${i + 1}"></button>`).join('')}
            </div>
          </div>
        </div>
        <div class="cert-detail">
          <div class="cert-detail-row"><span>Issuer</span><strong id="certIssuer"></strong></div>
          <div class="cert-detail-row"><span>Type</span><strong id="certType"></strong></div>
          <div class="cert-detail-row"><span>Completed</span><strong id="certDate"></strong></div>
          <a href="#" target="_blank" rel="noopener" class="btn btn-outline" id="certVerifyLink">Verify on Coursera ↗</a>
        </div>
      `;

      initGallery(body.querySelector('[data-gallery]'), galleryItems, (item) => {
        const issuerEl = document.getElementById('certIssuer');
        const typeEl = document.getElementById('certType');
        const dateEl = document.getElementById('certDate');
        const linkEl = document.getElementById('certVerifyLink');
        if (issuerEl) issuerEl.textContent = item.issuer;
        if (typeEl) typeEl.textContent = item.type;
        if (dateEl) dateEl.textContent = item.date;
        if (linkEl) linkEl.href = item.verifyUrl;
      });
    };

    const render = (data) => {
      if (data.kind === 'cert-single') return renderCertSingle(data);
      if (data.kind === 'cert-gallery') return renderCertGallery(data);
      return renderProject(data);
    };

    const openModal = (key) => {
      const data = modalContent[key];
      if (!data) return;
      render(data);
      lastFocused = document.activeElement;
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      closeBtn.focus();
    };

    const closeModal = () => {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    };

    triggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(trigger.getAttribute('data-modal-open'));
      });
    });

    closeBtn.addEventListener('click', closeModal);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });
  });

  /* ------------------------------------------------------------------
     BACK TO TOP
  ------------------------------------------------------------------ */
  safeInit('back to top', () => {
    const backToTop = document.getElementById('backToTop');
    if (!backToTop) return;

    backToTop.style.transition = 'opacity .3s ease';
    backToTop.style.opacity = '0';
    backToTop.style.pointerEvents = 'none';

    const toggleBackToTop = () => {
      const visible = window.scrollY > 600;
      backToTop.style.opacity = visible ? '1' : '0';
      backToTop.style.pointerEvents = visible ? 'auto' : 'none';
    };
    window.addEventListener('scroll', toggleBackToTop, { passive: true });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  /* ------------------------------------------------------------------
     BUTTON RIPPLE EFFECT
  ------------------------------------------------------------------ */
  safeInit('button ripple', () => {
    if (prefersReducedMotion) return;

    document.querySelectorAll('.btn, .icon-btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 650);
      });
    });
  });

  /* ------------------------------------------------------------------
     CONTACT FORM (front-end only — no backend wired up)
  ------------------------------------------------------------------ */
  safeInit('contact form', () => {
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');
    const submitBtn = contactForm ? contactForm.querySelector('.form-submit') : null;
    if (!contactForm || !formStatus) return;

    // ---- Where messages go ----
    // Powered by FormSubmit (formsubmit.co) — a free form-to-email backend that
    // needs NO signup, NO account, and NO API key. It just emails submissions
    // straight to CONTACT_EMAIL, silently, without opening anything on the
    // visitor's side.
    //
    // One-time step: the very FIRST message sent through this form makes
    // FormSubmit send a confirmation email to CONTACT_EMAIL — open it and click
    // "Activate Form" once. Every submission after that is delivered automatically,
    // with no further action from you or the visitor.
    const CONTACT_EMAIL = 'sumukhbrampure@gmail.com';
    const FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = contactForm.name.value.trim();
      const email = contactForm.email.value.trim();
      const subject = contactForm.subject.value.trim();
      const message = contactForm.message.value.trim();

      if (!name || !email || !subject || !message) {
        formStatus.textContent = 'Please fill in every field before sending.';
        formStatus.classList.add('error');
        return;
      }
      if (!emailPattern.test(email)) {
        formStatus.textContent = 'Please enter a valid email address.';
        formStatus.classList.add('error');
        return;
      }

      formStatus.classList.remove('error');
      formStatus.textContent = 'Sending…';
      if (submitBtn) submitBtn.disabled = true;

      const payload = new FormData(contactForm);
      payload.append('_subject', `Portfolio contact: ${subject}`);
      payload.append('_template', 'table');
      payload.append('_captcha', 'false');

      try {
        const response = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: payload
        });

        if (response.ok) {
          formStatus.classList.remove('error');
          formStatus.textContent = `Thanks, ${name.split(' ')[0]} — your message is on its way.`;
          contactForm.reset();
        } else {
          throw new Error('FormSubmit responded with an error');
        }
      } catch (err) {
        // Last-resort fallback so the message is never just lost — opens a
        // pre-filled email instead if the background send fails for any reason.
        const mailBody = `Name: ${name}\nEmail: ${email}\n\n${message}`;
        const mailtoLink = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailBody)}`;
        window.location.href = mailtoLink;

        formStatus.classList.remove('error');
        formStatus.textContent = `Thanks, ${name.split(' ')[0]} — opening your email app to send this instead.`;
        contactForm.reset();
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });

  /* ------------------------------------------------------------------
     COPYRIGHT YEAR — keeps the footer accurate without manual edits
  ------------------------------------------------------------------ */
  safeInit('copyright year', () => {
    const yearEl = document.getElementById('copyrightYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });

  /* ------------------------------------------------------------------
     SMOOTH SCROLL OFFSET FIX for in-page anchors (accounts for navbar height)
  ------------------------------------------------------------------ */
  safeInit('anchor scroll offset', () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId.length <= 1) return;
        const target = document.querySelector(targetId);
        if (!target) return;
        e.preventDefault();
        const navHeight = navbar.offsetHeight;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight + 1;
        window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
    });
  });

});