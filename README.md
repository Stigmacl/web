# Fusión 360 - Sitio Web Corporativo

Sitio web corporativo moderno con diseño Glassmorphism, desarrollado con HTML5, CSS3 y JavaScript puro.

**Estado del Proyecto**: ✅ Funcional y listo para uso

## Características

- Diseño Glassmorphism (efecto vidrio con transparencias y blur)
- Paleta de colores inspirada en BancoEstado (azules y naranjo institucional)
- Línea del tiempo interactiva que avanza con el scroll
- Botón flotante para navegación automática entre proyectos
- Completamente responsive (desktop, tablet, móvil)
- Animaciones suaves y elegantes
- Código limpio y bien documentado
- Preparado para migración a Power Pages

## Estructura de Archivos

```
/
├── index.html          # Estructura HTML principal
├── styles.css          # Estilos Glassmorphism y responsive
├── script.js           # Interactividad y animaciones
└── README.md           # Este archivo
```

## Características Técnicas

### HTML
- Semántica moderna
- Accesibilidad con atributos ARIA
- Comentarios indicando puntos de integración con Dataverse
- Estructura preparada para contenido dinámico

### CSS
- Variables CSS para fácil personalización
- Sistema de colores consistente (BancoEstado)
- Glassmorphism con backdrop-filter
- Grid y Flexbox para layouts
- Responsive con breakpoints: 768px, 1024px
- Animaciones CSS (@keyframes)

### JavaScript
- Vanilla JS (sin dependencias)
- Scroll animations optimizadas
- Navegación automática entre secciones
- Actualización dinámica del progreso de timeline
- Menú móvil funcional
- Código modular y comentado

## Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Azul Principal | `#003DA5` | Elementos principales |
| Azul Oscuro | `#002B7F` | Fondos y hover |
| Azul Claro | `#0052CC` | Highlights |
| Naranjo | `#FF6600` | Acentos y CTAs |
| Blanco | `#FFFFFF` | Textos principales |
| Grises | `#F5F7FA` - `#1E2329` | Fondos y textos secundarios |

## Funcionalidades JavaScript

### 1. Animaciones de Scroll
- Detecta cuando los items de la timeline entran en el viewport
- Aplica clase `.visible` para activar animaciones
- Actualiza la línea de progreso visual

### 2. Botón "Avanzar"
- Navega automáticamente al siguiente proyecto
- Scroll suave con offset ajustado
- Se oculta cuando se llega al final

### 3. Navegación del Header
- Resalta la sección activa en el menú
- Smooth scroll al hacer click en links
- Menú móvil con animación hamburguesa

## Migración a Power Pages

Este proyecto está preparado para ser migrado a Microsoft Power Pages. Los comentarios en el código indican los puntos donde se debe integrar con Dataverse.

### Pasos para Migrar:

#### 1. Crear Entidad en Dataverse

Crear una entidad personalizada llamada **"Proyecto"** con los siguientes campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Título | Single Line of Text | Nombre del proyecto |
| Descripción | Multiple Lines of Text | Descripción detallada |
| Imagen | Image | Imagen representativa |
| URL | URL | Link al proyecto |
| Orden | Whole Number | Orden de visualización |

#### 2. Subir Archivos a Power Pages

1. En Power Pages Studio, ir a **Web Files**
2. Subir los archivos:
   - `styles.css` → `/css/styles.css`
   - `script.js` → `/js/script.js`

#### 3. Crear Plantilla de Página Web

Usar el contenido de `index.html` como base para crear una nueva plantilla de página web.

#### 4. Implementar Liquid Template

Reemplazar los items estáticos de la timeline con un loop de Liquid:

```liquid
{% fetchxml proyectos %}
  <fetch>
    <entity name="cr123_proyecto">
      <attribute name="cr123_titulo" />
      <attribute name="cr123_descripcion" />
      <attribute name="cr123_imagen" />
      <attribute name="cr123_url" />
      <order attribute="cr123_orden" />
    </entity>
  </fetch>
{% endfetchxml %}

{% for proyecto in proyectos.results.entities %}
  <div class="timeline-item" data-index="{{ forloop.index0 }}">
    <div class="timeline-marker"></div>
    <div class="timeline-content glass-card">
      <div class="timeline-image">
        <img src="{{ proyecto.cr123_imagen.url }}" alt="{{ proyecto.cr123_titulo }}">
      </div>
      <div class="timeline-text">
        <h3 class="timeline-title">{{ proyecto.cr123_titulo }}</h3>
        <p class="timeline-description">{{ proyecto.cr123_descripcion }}</p>
        <a href="{{ proyecto.cr123_url }}" class="btn-glass" target="_blank">
          Ver proyecto
          <svg>...</svg>
        </a>
      </div>
    </div>
  </div>
{% endfor %}
```

#### 5. Incluir CSS y JS en la Plantilla

En el `<head>` de la plantilla:

```html
<link rel="stylesheet" href="/css/styles.css">
```

Antes del cierre del `</body>`:

```html
<script type="module" src="/js/script.js"></script>
```

## Desarrollo Local

### Requisitos
- Node.js 16+
- npm

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

El sitio estará disponible en `http://localhost:5173`

### Build

```bash
npm run build
```

Los archivos de producción se generarán en la carpeta `dist/`

## Personalización

### Cambiar Colores

Editar las variables CSS en `styles.css`:

```css
:root {
    --color-primary: #003DA5;
    --color-accent: #FF6600;
    /* ... otros colores ... */
}
```

### Añadir Más Proyectos

En `index.html`, duplicar la estructura `.timeline-item` y actualizar:
- `data-index` (índice numérico)
- Imagen src
- Título
- Descripción
- Link

### Cambiar Background

En `styles.css`, línea del body:

```css
background-image:
    linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)),
    url('TU_IMAGEN.jpg');
```

## Navegadores Soportados

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Notas Importantes

1. **Glassmorphism**: El efecto de vidrio requiere `backdrop-filter`, que tiene soporte limitado en navegadores antiguos
2. **Imágenes**: Las imágenes actuales son de Pexels (stock photos). Reemplazar con imágenes corporativas
3. **Links**: Los enlaces a proyectos son placeholders (`#proyecto-1`, etc.). Actualizar con URLs reales
4. **Performance**: Las animaciones de scroll usan throttling para optimizar rendimiento

## Licencia

© 2024 Fusión 360. Todos los derechos reservados.

---

**Desarrollado para migración a Power Pages**