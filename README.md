# Sistema de Banderas Escalable

Este proyecto está diseñado para ser escalable y permitir agregar múltiples países de manera fácil.

## Estructura del Proyecto

```
banderas-site/
├── data/                    # Archivos JSON con datos de países
│   ├── argentina.json
│   ├── chile.json
│   └── ...
├── flags/                   # Banderas de países
│   ├── argentina.svg
│   ├── chile.svg
│   └── provinces/           # Banderas de provincias/regiones
│       ├── buenos_aires.svg
│       ├── cordoba.svg
│       └── ...
├── maps/                    # Mapas SVG de países
│   ├── argentina.svg
│   ├── chile.svg
│   └── provinces/           # Mapas de provincias/regiones
│       ├── buenos_aires.svg
│       └── ...
├── js/
│   └── app.js              # Script principal (genérico)
├── css/
│   └── styles.css
└── *.html                  # Páginas HTML de cada país
```

## Cómo Agregar un Nuevo País

### 1. Crear archivo JSON de datos
Crear `data/nuevopais.json` con la estructura:
```json
{
  "country": {
    "id": "codigo_pais",
    "name": "Nombre del País",
    "flag": "flags/nuevopais.svg",
    "info": "Descripción del país"
  },
  "provinces": [
    {
      "id": "region_id",
      "name": "Nombre de la Región",
      "flag": "region.svg",
      "info": "Descripción de la región",
      "map": "region.svg"  // opcional
    }
  ]
}
```

### 2. Agregar configuración en app.js
En `js/app.js`, agregar el país a `COUNTRY_CONFIG`:
```javascript
'nuevopais': {
  dataUrl: 'data/nuevopais.json',
  svgUrl: 'maps/nuevopais.svg',
  provincesPath: 'flags/provinces/',
  mapsPath: 'maps/provinces/'
}
```

### 3. Actualizar detección de país
En la función `getCurrentCountry()`, agregar:
```javascript
if (path.includes('nuevopais')) return 'nuevopais';
```

### 4. Crear archivos necesarios
- `nuevopais.html` (copiar de `argentina.html` y modificar título)
- `flags/nuevopais.svg`
- `maps/nuevopais.svg`
- Banderas de provincias en `flags/provinces/`
- Mapas de provincias en `maps/provinces/` (opcional)

## Características del Sistema

- **Genérico**: Un solo `app.js` maneja todos los países
- **Escalable**: Fácil agregar nuevos países
- **Flexible**: Soporte para mapas de provincias opcionales
- **Mantenible**: Configuración centralizada
- **Responsive**: Funciona en dispositivos móviles

## Uso

1. Abrir `argentina.html` para ver Argentina
2. Hacer clic en una provincia para ver su información
3. Usar el botón "← Volver" para regresar a la vista del país
