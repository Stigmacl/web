/**
 * Fusión 360 - JavaScript Interactivo
 * Gestión de scroll animations y navegación
 * Preparado para migración a Power Pages
 */

// ================================
// Variables Globales
// ================================
let currentItemIndex = 0;
const timelineItems = document.querySelectorAll('.timeline-item');
const timelineProgress = document.querySelector('.timeline-progress');
const nextButton = document.getElementById('nextButton');

// ================================
// Inicialización
// ================================
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initNavigationHighlight();
    initNextButton();
    initMobileMenu();

    // Primera animación de entrada
    setTimeout(() => {
        if (timelineItems.length > 0) {
            timelineItems[0].classList.add('visible');
        }
    }, 300);
});

// ================================
// Scroll Animations
// ================================
function initScrollAnimations() {
    window.addEventListener('scroll', () => {
        updateTimelineProgress();
        revealTimelineItems();
        updateNextButtonVisibility();
    });
}

/**
 * Actualiza el progreso visual de la línea del tiempo
 * basado en la posición del scroll de la página
 */
function updateTimelineProgress() {
    if (!timelineProgress) return;

    const timeline = document.querySelector('.timeline');
    if (!timeline) return;

    // Obtener posiciones absolutas basadas en el documento
    const timelineStart = timeline.offsetTop;
    const timelineHeight = timeline.offsetHeight;
    const timelineEnd = timelineStart + timelineHeight;

    // Obtener la posición actual del scroll
    const scrollPosition = window.scrollY + window.innerHeight / 2;

    // Calcular el progreso basado en el scroll total
    let progress = 0;

    if (scrollPosition >= timelineStart && scrollPosition <= timelineEnd) {
        progress = ((scrollPosition - timelineStart) / timelineHeight) * 100;
    } else if (scrollPosition > timelineEnd) {
        progress = 100;
    } else if (scrollPosition < timelineStart) {
        progress = 0;
    }

    // Limitar el progreso entre 0 y 100
    progress = Math.max(0, Math.min(100, progress));

    timelineProgress.style.height = `${progress}%`;
}

/**
 * Revela los items de la timeline cuando entran en el viewport
 */
function revealTimelineItems() {
    timelineItems.forEach((item, index) => {
        const itemRect = item.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Trigger cuando el item está en el 75% del viewport
        if (itemRect.top < windowHeight * 0.75) {
            item.classList.add('visible');

            // Actualizar índice del item actual
            if (itemRect.top < windowHeight * 0.5 && itemRect.bottom > windowHeight * 0.5) {
                currentItemIndex = index;
            }
        }
    });
}

/**
 * Actualiza la visibilidad del botón "Avanzar"
 * Se oculta cuando se llega al último item
 */
function updateNextButtonVisibility() {
    if (!nextButton) return;

    const lastItem = timelineItems[timelineItems.length - 1];
    if (!lastItem) return;

    const lastItemRect = lastItem.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Ocultar el botón cuando el último item está completamente visible
    if (lastItemRect.bottom < windowHeight) {
        nextButton.classList.add('hidden');
    } else {
        nextButton.classList.remove('hidden');
    }
}

// ================================
// Navegación con Botón "Avanzar"
// ================================
function initNextButton() {
    if (!nextButton) return;

    nextButton.addEventListener('click', () => {
        scrollToNextItem();
    });
}

/**
 * Desplaza el scroll hacia el siguiente item de la timeline
 * con animación suave
 */
function scrollToNextItem() {
    // Calcular el siguiente índice
    const nextIndex = currentItemIndex + 1;

    // Verificar que existe el siguiente item
    if (nextIndex >= timelineItems.length) {
        // Si no hay más items, ir a "Quiénes Somos"
        const aboutSection = document.getElementById('quienes-somos');
        if (aboutSection) {
            aboutSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
        return;
    }

    const nextItem = timelineItems[nextIndex];
    if (!nextItem) return;

    // Scroll suave hacia el siguiente item
    // Ajustamos el offset para centrar mejor el item
    const itemTop = nextItem.offsetTop;
    const offset = 120; // Espacio desde el top (considerando el header)

    window.scrollTo({
        top: itemTop - offset,
        behavior: 'smooth'
    });

    // Actualizar el índice actual
    currentItemIndex = nextIndex;
}

// ================================
// Navegación del Header
// ================================
function initNavigationHighlight() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;

            if (window.pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // Smooth scroll para los links del nav
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                const offset = 80; // Altura del header
                const targetPosition = targetSection.offsetTop - offset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ================================
// Menú Móvil
// ================================
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (!menuToggle || !mainNav) return;

    menuToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        menuToggle.classList.toggle('active');

        // Animación del icono hamburguesa
        const spans = menuToggle.querySelectorAll('span');
        spans.forEach((span, index) => {
            if (menuToggle.classList.contains('active')) {
                if (index === 0) span.style.transform = 'rotate(45deg) translateY(8px)';
                if (index === 1) span.style.opacity = '0';
                if (index === 2) span.style.transform = 'rotate(-45deg) translateY(-8px)';
            } else {
                span.style.transform = '';
                span.style.opacity = '';
            }
        });
    });

    // Cerrar menú al hacer click en un link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mainNav.classList.remove('active');
            menuToggle.classList.remove('active');

            const spans = menuToggle.querySelectorAll('span');
            spans.forEach(span => {
                span.style.transform = '';
                span.style.opacity = '';
            });
        });
    });
}

// ================================
// Utility Functions
// ================================

/**
 * Throttle function para optimizar performance
 * en eventos de scroll
 */
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ================================
// NOTAS PARA MIGRACIÓN A POWER PAGES
// ================================
/*
 * Al migrar a Power Pages / Dynamics 365:
 *
 * 1. Reemplazar los items de timeline con contenido dinámico desde Dataverse:
 *    - Crear una entidad personalizada "Proyectos" con campos:
 *      - Título (Single Line of Text)
 *      - Descripción (Multiple Lines of Text)
 *      - Imagen (Image)
 *      - URL del proyecto (URL)
 *      - Orden (Whole Number)
 *
 * 2. Usar Liquid template para renderizar los items:
 *    {% fetchxml proyectos %}
 *      <fetch>
 *        <entity name="cr123_proyecto">
 *          <attribute name="cr123_titulo" />
 *          <attribute name="cr123_descripcion" />
 *          <attribute name="cr123_imagen" />
 *          <attribute name="cr123_url" />
 *          <order attribute="cr123_orden" />
 *        </entity>
 *      </fetch>
 *    {% endfetchxml %}
 *
 *    {% for proyecto in proyectos.results.entities %}
 *      <div class="timeline-item" data-index="{{ forloop.index0 }}">
 *        ...
 *      </div>
 *    {% endfor %}
 *
 * 3. Este JavaScript funcionará sin cambios con el contenido dinámico,
 *    siempre que se mantengan las clases CSS y la estructura HTML.
 *
 * 4. Configurar Web Files en Power Pages para subir:
 *    - styles.css
 *    - script.js
 *
 * 5. Incluir los archivos en la plantilla de página web.
 */