// app.js - Versión escalable para múltiples países
const COUNTRY_CONFIG = {
  'argentina': {
    dataUrl: 'data/argentina.json',
    svgUrl: 'maps/argentina.svg',
    provincesPath: 'flags/provinces/',
    mapsPath: 'maps/provinces/'
  },
  'chile': {
    dataUrl: 'data/chile.json',
    svgUrl: 'maps/chile.svg',
    provincesPath: 'flags/provinces/',
    mapsPath: 'maps/provinces/'
  }
  // Aquí podrás agregar más países en el futuro:
  // 'uruguay': {
  //   dataUrl: 'data/uruguay.json',
  //   svgUrl: 'maps/uruguay.svg',
  //   provincesPath: 'flags/provinces/',
  //   mapsPath: 'maps/provinces/'
  // }
};

// Detectar país actual desde la URL o nombre del archivo
function getCurrentCountry() {
  const path = window.location.pathname;
  if (path.includes('argentina')) return 'argentina';
  if (path.includes('chile')) return 'chile';
  // Agregar más países según sea necesario
  return 'argentina'; // default
}

const currentCountry = getCurrentCountry();
const config = COUNTRY_CONFIG[currentCountry];
const DATA_URL = config.dataUrl;
const SVG_URL = config.svgUrl;

const mapContainer = document.getElementById('map-container');
const flagImg = document.getElementById('flag-img');
const nameEl = document.getElementById('entity-name');
const infoEl = document.getElementById('entity-info');
const backBtn = document.getElementById('back-btn');

// Nuevos elementos para la sección de provincia
const countrySection = document.getElementById('country-section');
const provinceSection = document.getElementById('province-section');
const provinceFlagImg = document.getElementById('province-flag-img');
const provinceNameEl = document.getElementById('province-name');
const provinceInfoEl = document.getElementById('province-info');
const viewMoreBtn = document.getElementById('view-more-btn');

let data = null;
let currentLevel = 'country'; // 'country' | 'province' | 'department'
let currentProvince = null;
let currentDepartment = null;

// ------------------------------
// Helpers de rutas para banderas
// Estructura destino (sin carpeta cityId):
// flags/provinces/{provinceId}/province.svg
// flags/provinces/{provinceId}/departments/{departmentId}/department.svg
// flags/provinces/{provinceId}/departments/{departmentId}/cities/{cityFile}
// Donde cityFile puede venir del JSON (p.ej. rosario.svg). Si no hay, se usa {city.id}.svg como fallback.

function buildProvinceFlagPath(province) {
  if (!province) return '';
  if (province.flag && province.flag.startsWith('http')) return province.flag;
  if (province.flag && !province.flag.includes('/')) {
    // Archivo relativo provisto por JSON
    return `${config.provincesPath}${province.id}/` + province.flag;
  }
  if (province.flag) {
    // Ruta relativa con subcarpetas provista por JSON
    return `${config.provincesPath}${province.flag}`;
  }
  // Default sugerido
  return `${config.provincesPath}${province.id}/province.svg`;
}

function buildDepartmentFlagPath(provinceId, department) {
  if (!provinceId || !department) return '';
  if (department.flag && department.flag.startsWith('http')) return department.flag;
  if (department.flag && !department.flag.includes('/')) {
    return `${config.provincesPath}${provinceId}/departments/${department.id}/` + department.flag;
  }
  if (department.flag) {
    return `${config.provincesPath}${department.flag}`;
  }
  // Default sugerido
  return `${config.provincesPath}${provinceId}/departments/${department.id}/department.svg`;
}

function buildCityFlagPath(provinceId, departmentId, city) {
  if (!provinceId || !departmentId || !city) return '';
  if (city.flag && city.flag.startsWith('http')) return city.flag;
  if (city.flag && city.flag.includes('/')) {
    // Mantener compatibilidad si ya viene armado con subcarpetas
    return `${config.provincesPath}${city.flag}`;
  }
  const fileName = city.flag ? city.flag : `${city.id}.svg`;
  // Nueva estructura sin carpeta cityId; los archivos de ciudades viven directamente dentro de cities/
  return `${config.provincesPath}${provinceId}/departments/${departmentId}/cities/${fileName}`;
}

async function init() {
  data = await fetchJSON(DATA_URL);
  showCountryInfo();
  await loadSVGInto(SVG_URL, mapContainer);
  attachProvinceHandlers();
}

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('No se pudo cargar JSON: '+url);
  return r.json();
}

async function loadSVGInto(url, container) {
  try {
    const r = await fetch(url);
    if (!r.ok) {
      console.warn('No se pudo cargar el SVG: ' + url + ' (' + r.status + ')');
      return; // No reemplazar el contenido actual si falla
    }
    const svgText = await r.text();
    container.innerHTML = svgText;
    // mejora: podrías inlinear atributos accesibles, etc.
  } catch (err) {
    console.warn('Error cargando SVG: ' + url, err);
    // No reemplazar el contenido actual si falla
  }
}

function showCountryInfo() {
  currentLevel = 'country';
  currentProvince = null;
  currentDepartment = null;
  
  // Mostrar información del país
  nameEl.textContent = data.country.name;
  infoEl.textContent = data.country.info;
  flagImg.src = data.country.flag;
  
  // Mostrar sección del país y ocultar sección de provincia
  countrySection.classList.remove('hidden');
  provinceSection.classList.add('hidden');
  backBtn.classList.add('hidden');
}

function attachProvinceHandlers() {
  // asumir que en el SVG cada provincia tiene class="province" y id igual al id del JSON
  const svg = mapContainer.querySelector('svg');
  if (!svg) return;
  const provinces = svg.querySelectorAll('.province');
  provinces.forEach(p => {
    p.style.transition = 'all .15s';
    p.tabIndex = 0;
    p.addEventListener('click', () => onProvinceClick(p.id));
    p.addEventListener('keydown', (e) => { if (e.key === 'Enter') onProvinceClick(p.id); });
    p.addEventListener('mouseover', ()=> p.classList.add('hover'));
    p.addEventListener('mouseout', ()=> p.classList.remove('hover'));
  });
}

// Asegura que los elementos del mapa provincial tengan la clase .department
function ensureDepartmentClasses() {
  const svg = mapContainer.querySelector('svg');
  if (!svg || !currentProvince || !currentProvince.departments) return;

  // 1) Asignar la clase por ids definidos en el JSON (preciso)
  currentProvince.departments.forEach(d => {
    const el = svg.querySelector(`[id="${d.id}"]`);
    if (el) {
      el.classList.add('department');
      el.tabIndex = 0;
      el.style.cursor = 'pointer';
    }
  });

  // 2) Fallback: agregar class a todo path con id (para no editar el SVG a mano)
  svg.querySelectorAll('path[id]').forEach(p => {
    if (!p.classList.contains('department')) {
      p.classList.add('department');
      p.tabIndex = 0;
      p.style.cursor = 'pointer';
    }
  });
}

function onProvinceClick(provinceId) {
  const prov = data.provinces.find(x => x.id === provinceId);
  if (!prov) {
    console.warn('Provincia no encontrada en JSON: ', provinceId);
    return;
  }
  currentLevel = 'province';
  currentProvince = prov;
  currentDepartment = null;
  
  // Actualizar información de la provincia en la sección correspondiente
  provinceNameEl.textContent = prov.name;
  provinceInfoEl.textContent = prov.info || 'Sin información disponible.';
  
  // Construir ruta completa para la bandera de la provincia
  const provinceFlagPath = buildProvinceFlagPath(prov);
  provinceFlagImg.src = provinceFlagPath;
  
  // Mostrar sección de provincia y ocultar sección del país
  countrySection.classList.add('hidden');
  provinceSection.classList.remove('hidden');
  backBtn.classList.remove('hidden');
  if (viewMoreBtn) viewMoreBtn.classList.remove('hidden');

  // Mantener el mapa del país visible; solo resaltar la provincia seleccionada
  highlightProvince(provinceId);

  // Desplazar al tope para ver el panel con la info actualizada
  try {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch(_) {
    window.scrollTo(0, 0);
  }
}

backBtn.addEventListener('click', () => {
  if (currentLevel === 'department') {
    // Volver del departamento a la provincia
    currentLevel = 'province';
    currentDepartment = null;
    
    // Restaurar información de la provincia
    provinceNameEl.textContent = currentProvince.name;
    provinceInfoEl.textContent = currentProvince.info || 'Sin información disponible.';
    
    // Recargar el mapa de la provincia
    const provinceMapPath = currentProvince.map.startsWith('http')
      ? currentProvince.map
      : config.mapsPath + currentProvince.map;
    loadSVGInto(provinceMapPath, mapContainer).then(() => {
      ensureDepartmentClasses();
      attachDepartmentHandlers();
    });
    if (viewMoreBtn) viewMoreBtn.classList.add('hidden');
  } else {
    // Volver de la provincia al país
    showCountryInfo();
    loadSVGInto(SVG_URL, mapContainer).then(attachProvinceHandlers);
  }
});

function highlightProvince(id) {
  // ejemplo simple: dar un estilo al path seleccionado en el svg
  const svg = mapContainer.querySelector('svg');
  if (!svg) return;
  svg.querySelectorAll('.province').forEach(p => p.style.opacity = (p.id===id? '1':'0.4'));
}

window.addEventListener('DOMContentLoaded', init);

// Acción de "Ver más...": reemplaza el mapa SOLO cuando el usuario lo solicita
if (viewMoreBtn) {
  viewMoreBtn.addEventListener('click', () => {
    if (!currentProvince) return;
    if (!currentProvince.map) return; // no hacer nada si no hay mapa provincial definido
    const provinceMapPath = currentProvince.map.startsWith('http')
      ? currentProvince.map
      : config.mapsPath + currentProvince.map;
    loadSVGInto(provinceMapPath, mapContainer).then(() => {
      ensureDepartmentClasses();
      attachDepartmentHandlers();
    });
    if (viewMoreBtn) viewMoreBtn.classList.add('hidden');
  });
}

function attachDepartmentHandlers() {
  const svg = mapContainer.querySelector('svg');
  if (!svg || !currentProvince || !currentProvince.departments) return;
  
  const departments = svg.querySelectorAll('.department');
  departments.forEach(dept => {
    dept.style.transition = 'all .15s';
    dept.tabIndex = 0;
    dept.addEventListener('click', () => onDepartmentClick(dept.id));
    dept.addEventListener('keydown', (e) => { if (e.key === 'Enter') onDepartmentClick(dept.id); });
    dept.addEventListener('mouseover', () => dept.classList.add('hover'));
    dept.addEventListener('mouseout', () => dept.classList.remove('hover'));
  });
}

function onDepartmentClick(departmentId) {
  const dept = currentProvince.departments.find(d => d.id === departmentId);
  if (!dept) {
    console.warn('Departamento no encontrado: ', departmentId);
    return;
  }
  
  currentLevel = 'department';
  currentDepartment = dept;
  
  // Actualizar el panel con información del departamento y ciudades
  provinceNameEl.textContent = `${currentProvince.name} - ${dept.name}`;
  
  // Crear HTML para mostrar (opcional) bandera departamental y las banderas de las ciudades
  let citiesHTML = '';
  // Bandera departamental (si hay)
  const deptFlagSrc = buildDepartmentFlagPath(currentProvince.id, dept);
  if (deptFlagSrc) {
    citiesHTML += `
      <div class="department-flag-wrap">
        <img src="${deptFlagSrc}" alt="Bandera del departamento ${dept.name}" class="department-flag" />
      </div>
    `;
  }
  if (dept.cities && dept.cities.length > 0) {
    citiesHTML += '<div class="cities-container">';
    dept.cities.forEach(city => {
      const cityFlagPath = buildCityFlagPath(currentProvince.id, dept.id, city);
      citiesHTML += `
        <div class="city-item">
          <img src="${cityFlagPath}" alt="Bandera de ${city.name}" class="city-flag" />
          <div class="city-info">
            <h4>${city.name}</h4>
            <p>${city.info || 'Sin información disponible.'}</p>
          </div>
        </div>
      `;
    });
    citiesHTML += '</div>';
  } else {
    citiesHTML += '<p>No hay ciudades con banderas registradas en este departamento.</p>';
  }
  
  provinceInfoEl.innerHTML = citiesHTML;
  attachCityExpandHandlers();
  
  // Resaltar el departamento seleccionado
  highlightDepartment(departmentId);

  // Desplazar al tope para ver el panel con la info actualizada
  try {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch(_) {
    window.scrollTo(0, 0);
  }
}

function highlightDepartment(id) {
  const svg = mapContainer.querySelector('svg');
  if (!svg) return;
  const departments = svg.querySelectorAll('.department');
  departments.forEach(d => {
    // Atenuar todos por defecto
    d.classList.remove('selected', 'dimmed');
    d.style.opacity = '0.35';
    d.style.stroke = '';
    d.style.strokeWidth = '';
    d.style.filter = '';
  });

  const selected = svg.querySelector(`.department[id="${id}"]`);
  if (!selected) return;

  // Marcar seleccionado claramente
  selected.classList.add('selected');
  selected.style.opacity = '1';
  selected.style.stroke = '#ff9800';
  selected.style.strokeWidth = '3';
  selected.style.filter = 'drop-shadow(0 0 2px rgba(0,0,0,0.6))';

  // Traerlo al frente para que no quede tapado
  const parent = selected.parentNode;
  if (parent && typeof parent.appendChild === 'function') {
    parent.appendChild(selected);
  }

  // Asegurar que los textos queden SIEMPRE arriba
  // 1) Evitar que bloqueen clics
  svg.querySelectorAll('text').forEach(t => {
    t.style.pointerEvents = 'none';
  });
  // 2) Reordenar cada texto al final de su propio grupo/padre
  svg.querySelectorAll('text').forEach(t => {
    const tp = t.parentNode;
    if (tp && typeof tp.appendChild === 'function') {
      tp.appendChild(t);
    }
  });
}

// Maneja la expansión/colapso de banderas de ciudades con alternancia exclusiva
function attachCityExpandHandlers() {
  const cityItems = provinceInfoEl.querySelectorAll('.city-item');
  if (!cityItems.length) return;

  let currentExpanded = null;

  cityItems.forEach(item => {
    item.addEventListener('click', (e) => {
      // Evitar seleccionar texto al hacer doble click
      e.preventDefault();

      // Si clickeamos el ya expandido: colapsar
      if (item.classList.contains('expanded')) {
        item.classList.remove('expanded');
        currentExpanded = null;
        return;
      }

      // Colapsar el previamente expandido
      if (currentExpanded && currentExpanded !== item) {
        currentExpanded.classList.remove('expanded');
      }

      // Expandir el actual
      item.classList.add('expanded');
      currentExpanded = item;
    });
  });
}
