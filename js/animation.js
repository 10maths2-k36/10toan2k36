document.addEventListener("DOMContentLoaded", function() {
    document.body.classList.remove("fade-out");
    if (!document.getElementById("preloader")) {
        const preloaderHTML = `
            <div id="preloader">
                <div class="spinner"></div>
            </div>
        `;
        document.body.insertAdjacentHTML('afterbegin', preloaderHTML);
    }
    const preloader = document.getElementById("preloader");
    window.addEventListener("load", () => {
        setTimeout(() => {
            if (preloader) {
                preloader.classList.add("loaded");
            }
        }, 500);
    });
    const targetSelectors = 'main > *, .container > *, section, .card, .achievement-item, .member-card';
    const elementsToAnimate = document.querySelectorAll(targetSelectors);
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px' 
    });
    elementsToAnimate.forEach(el => {
        if (!el.closest('header') && !el.closest('nav')) {
            el.classList.add("animate-on-scroll");
            observer.observe(el);
        }
    });
    const themeBtn = document.querySelector('.theme-btn');
    if (themeBtn) {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
        }
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
        });
    }
    const links = document.querySelectorAll("a");
    links.forEach(link => {
        link.addEventListener("click", e => {
            const targetUrl = link.getAttribute("href");
            if (
                targetUrl &&
                !targetUrl.startsWith("http") &&
                !targetUrl.startsWith("#") &&
                link.getAttribute("target") !== "_blank"
            ) {
                e.preventDefault();
                document.body.classList.add("fade-out");
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 200);
            }
        });
    });
    const navContainers = document.querySelectorAll('.site-nav, .menu');
    navContainers.forEach((container) => {
        let indicator = container.querySelector('.nav-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'nav-indicator';
            container.appendChild(indicator);
        }
        const items = container.querySelectorAll('a');
        let activeItem = container.querySelector('a.active');
        function moveIndicator(el) {
            const containerRect = container.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const left = elRect.left - containerRect.left;
            const top = elRect.top - containerRect.top;
            indicator.style.opacity = '1';
            indicator.style.transform = `translate(${left}px, ${top}px)`;
            indicator.style.width = `${elRect.width}px`;
            indicator.style.height = `${elRect.height}px`;
        }
        if (activeItem) {
            moveIndicator(activeItem);
        } else {
            indicator.style.opacity = '0';
        }
        items.forEach((item) => {
            item.addEventListener('mouseenter', () => {
                moveIndicator(item);
            });
        });
        container.addEventListener('mouseleave', () => {
            if (activeItem) {
                moveIndicator(activeItem);
            } else {
                indicator.style.opacity = '0';
            }
        });
    });
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
        .hover-word {
            display: inline-block;
            position: relative;
            transition: transform 0.15s cubic-bezier(0.25, 1, 0.5, 1), color 0.15s ease;
            cursor: default;
            z-index: 2;
        }
        .hover-word:hover {
            transform: translateY(-3px) scale(1.08);
            color: #38bdf8;
        }
        body:not(.dark-mode) .hover-word:hover {
            color: #007bff;
        }
    `;
    document.head.appendChild(styleTag);
    const textGlassBox = document.createElement("div");
    textGlassBox.className = "liquid-glass-indicator";
    Object.assign(textGlassBox.style, {
        position: "absolute",
        pointerEvents: "none",
        transition: "transform 0.15s cubic-bezier(0.25, 1, 0.5, 1), width 0.15s ease, height 0.15s ease, opacity 0.15s ease, background 0.2s ease, border 0.2s ease",
        zIndex: "1",
        opacity: "0",
        borderRadius: "50px", 
    });
    function updateGlassTheme() {
        if (document.body.classList.contains('dark-mode')) {
            textGlassBox.style.background = "rgba(255, 255, 255, 0.1)";
            textGlassBox.style.backdropFilter = "blur(14px) saturate(180%)";
            textGlassBox.style.webkitBackdropFilter = "blur(14px) saturate(180%)";
            textGlassBox.style.border = "1px solid rgba(255, 255, 255, 0.2)";
            textGlassBox.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.35)";
        } else {
            textGlassBox.style.background = "rgba(255, 255, 255, 0.5)";
            textGlassBox.style.backdropFilter = "blur(14px) saturate(190%)";
            textGlassBox.style.webkitBackdropFilter = "blur(14px) saturate(190%)";
            textGlassBox.style.border = "1px solid rgba(255, 255, 255, 0.7)";
            textGlassBox.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.08)";
        }
    }
    const paragraphs = document.querySelectorAll('.card p, .card h3, p, h3');
    paragraphs.forEach(p => {
        p.style.position = "relative";
        p.style.isolation = "isolate";
        function wrapTextNodes(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.nodeValue;
                if (!text.trim()) return;
                const fragment = document.createDocumentFragment();
                const words = text.split(/(\s+)/);
                words.forEach(part => {
                    if (part.trim().length > 0) {
                        const span = document.createElement('span');
                        span.className = 'hover-word';
                        span.textContent = part;
                        span.addEventListener("mouseenter", () => {
                            updateGlassTheme();
                            if (textGlassBox.parentNode !== p) {
                                p.appendChild(textGlassBox);
                            }
                            const rect = span.getBoundingClientRect();
                            const parentRect = p.getBoundingClientRect();
                            textGlassBox.style.left = `${rect.left - parentRect.left - 6}px`;
                            textGlassBox.style.top = `${rect.top - parentRect.top - 3}px`;
                            textGlassBox.style.width = `${rect.width + 12}px`;
                            textGlassBox.style.height = `${rect.height + 6}px`;
                            textGlassBox.style.opacity = "1";
                        });
                        fragment.appendChild(span);
                    } else if (part.length > 0) {
                        fragment.appendChild(document.createTextNode(part));
                    }
                });
                node.parentNode.replaceChild(fragment, node);
            } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
                Array.from(node.childNodes).forEach(child => wrapTextNodes(child));
            }
        }
        Array.from(p.childNodes).forEach(child => wrapTextNodes(child));
        p.addEventListener("mouseleave", () => {
            textGlassBox.style.opacity = "0";
        });
    });
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            textGlassBox.style.opacity = "0";
        });
    }
});