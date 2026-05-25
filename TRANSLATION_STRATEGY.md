# Estrategia de Traducciones - Cavero Diego

## Sistema Dual de Traducciones

El proyecto Cavero Diego utiliza **dos sistemas de traducción separados** con propósitos distintos:

---

## 1. Traducciones Build-Time (Server-Side)

### Ubicación
- `src/_data/i18n/es.json`
- `src/_data/i18n/en.json`

### Propósito
Traducciones para contenido **estático** que se renderiza durante el build de Eleventy.

### Uso
```njk
{{ 'nav.home' | t(lang) }}
{{ 'empresas.hero_title' | t(lang) | safe }}
```

### Características
- ✅ Cargadas **una sola vez** al inicio del build (cacheadas en `.eleventy.js`)
- ✅ Sin impacto en el tamaño del HTML final
- ✅ SEO-friendly (contenido renderizado en HTML)
- ✅ Contenido completo de todas las páginas (~115 líneas por idioma)

### Contenido
- Navegación
- Páginas estáticas (home, empresas, productos)
- Footers
- Metadatos y SEO
- Círculo Cavero (formulario y textos estáticos)

---

## 2. Traducciones Runtime (Client-Side)

### Ubicación
- `src/assets/data/translations.json`

### Propósito
Traducciones para contenido **dinámico** generado por JavaScript en el navegador.

### Uso
```javascript
await loadTranslations();
const lang = getCurrentLanguage();
const text = getTranslation('cart.title', lang);
```

### Características
- ✅ Cargadas **asíncronamente** cuando se necesitan
- ✅ Cacheadas por el navegador (archivo separado)
- ✅ Compartidas entre todas las páginas
- ✅ Contenido mínimo (~500 bytes por idioma)

### Contenido
- Panel del carrito (inyectado por JS)
- Mensajes de éxito de Círculo Cavero (actualizados dinámicamente)
- Feedback de UI (e.g., "✓ Añadido")

---

## 3. Flujo de Traducción

### Build Time (Eleventy)

```
1. `.eleventy.js` carga `src/_data/i18n/*.json` → caché en memoria
2. Template usa `{{ 'key' | t(lang) }}` → lookup en caché
3. HTML generado con texto traducido → SEO optimizado
```

### Runtime (Navegador)

```
1. Página carga → `global.js` se ejecuta
2. Usuario interactúa → trigger de función traducida
3. `loadTranslations()` → fetch de `/assets/data/translations.json` (una vez)
4. `getTranslation('key', lang)` → lookup en memoria
5. UI actualizada con texto traducido
```

---

## 4. Mapeo de Contenidos

### Build-Time Translations (`_data/i18n/`)

| Sección | Claves | Renderizado |
|---------|--------|-------------|
| nav | `home`, `products`, `campo`, `viaje`, `empresas` | Server |
| home | `hero`, `territorio`, `manifiesto`, `materiales` | Server |
| footer | `email`, `handle`, `origin`, `name`, `rights` | Server |
| empresas | `eyebrow`, `hero_title`, `form_*`, etc. | Server |
| **cc** | `eyebrow`, `title`, `desc`, `button`, `legal`, etc. | Server |

### Runtime Translations (`assets/data/translations.json`)

| Sección | Claves | Renderizado |
|---------|--------|-------------|
| **cart** | `title`, `close`, `emptyLabel`, `checkoutBtn`, etc. | Client |
| **cc** | `eyebrow`, `successTitle`, `successDesc` | Client |

### ⚠️ Duplicación Intencional: `cc` Section

La sección `cc` (Círculo Cavero) aparece en **ambos** archivos:

- **Build-time:** Para renderizar el panel HTML inicial
- **Runtime:** Para actualizar el mensaje de éxito tras envío del formulario

Esto es **intencional** y **necesario** porque:
1. El panel se renderiza en HTML (build-time)
2. El mensaje de éxito se inyecta con JS (runtime)

---

## 5. Reglas de Uso

### ¿Cuándo usar Build-Time?

✅ Contenido estático de la página
✅ SEO importante
✅ Estructura HTML
✅ Metadatos

```njk
<h1>{{ 'home.hero.title' | t(lang) | safe }}</h1>
<meta name="description" content="{{ description }}">
```

### ¿Cuándo usar Runtime?

✅ Contenido inyectado por JavaScript
✅ UI dinámica (modales, paneles)
✅ Mensajes de feedback
✅ Contenido que cambia sin reload

```javascript
const t = getTranslation('cart.emptyLabel', lang);
container.innerHTML = `<span>${t}</span>`;
```

---

## 6. Optimizaciones Implementadas

### Build-Time
- [x] Caché de traducciones en memoria (`.eleventy.js`)
- [x] Carga única al inicio del build
- [x] ~25% mejora en tiempo de build

### Runtime
- [x] Carga asíncrona bajo demanda
- [x] Caché en memoria del navegador
- [x] Fallback si fetch falla
- [x] ~30 KB menos de HTML por página

---

## 7. Estructura de Archivos

```
CaveroDiego/
├── src/
│   ├── _data/
│   │   └── i18n/
│   │       ├── es.json          # Build-time ES (3.2 KB)
│   │       └── en.json          # Build-time EN (3.5 KB)
│   └── assets/
│       └── data/
│           └── translations.json # Runtime ES+EN (1 KB)
├── .eleventy.js                  # Caché de traducciones build-time
└── src/assets/js/global.js       # Loader de traducciones runtime
```

---

## 8. Añadir Nueva Traducción

### Para Contenido Estático (Build-Time)

1. Agregar clave en `src/_data/i18n/es.json`:
```json
{
  "nueva_seccion": {
    "titulo": "Mi Título"
  }
}
```

2. Agregar traducción en `src/_data/i18n/en.json`:
```json
{
  "nueva_seccion": {
    "titulo": "My Title"
  }
}
```

3. Usar en template:
```njk
<h2>{{ 'nueva_seccion.titulo' | t(lang) }}</h2>
```

### Para Contenido Dinámico (Runtime)

1. Agregar clave en `src/assets/data/translations.json`:
```json
{
  "es": {
    "nueva_feature": {
      "mensaje": "Texto en español"
    }
  },
  "en": {
    "nueva_feature": {
      "mensaje": "Text in English"
    }
  }
}
```

2. Usar en JavaScript:
```javascript
await loadTranslations();
const lang = getCurrentLanguage();
const texto = getTranslation('nueva_feature.mensaje', lang);
```

---

## 9. Testing de Traducciones

### Verificar Build-Time
```bash
npm run build
# Revisar HTML generado en _site/
```

### Verificar Runtime
1. Abrir navegador en `/`
2. Abrir DevTools → Network
3. Buscar request a `/assets/data/translations.json`
4. Verificar que se carga una sola vez
5. Interactuar con carrito o Círculo Cavero
6. Verificar textos traducidos correctamente

---

## 10. Roadmap

### Completado ✅
- [x] Caché de traducciones build-time
- [x] Sistema de carga asíncrona runtime
- [x] Separación de concerns (build vs. runtime)
- [x] Documentación de estrategia

### Futuro 🔮
- [ ] Agregar más idiomas (FR, DE, etc.)
- [ ] CLI tool para detectar claves faltantes
- [ ] Validación de traducciones en CI/CD
- [ ] Hot-reload de traducciones en dev mode

---

## 11. Troubleshooting

### Problema: Traducciones no aparecen en HTML
**Solución:** Verificar que la clave existe en `src/_data/i18n/[lang].json` y que el filtro `| t(lang)` recibe el idioma correcto.

### Problema: Traducciones no aparecen en carrito/panel
**Solución:** Abrir DevTools → Console. Verificar que no hay errores de fetch. Verificar que `translations.json` se carga correctamente.

### Problema: Build lento
**Solución:** Ya optimizado. Las traducciones se cachean una sola vez.

### Problema: Contenido duplicado
**Solución:** Normal. Algunas claves (como `cc.*`) están en ambos archivos intencionalmente.

---

## 12. Referencias

- Eleventy i18n Plugin: https://www.11ty.dev/docs/plugins/i18n/
- Performance Optimizations: ver `PERFORMANCE_OPTIMIZATIONS.md`
- Translation files:
  - Build: `src/_data/i18n/`
  - Runtime: `src/assets/data/translations.json`
- Implementation: `.eleventy.js` y `src/assets/js/global.js`
