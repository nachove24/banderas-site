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

let data = null;
let currentLevel = 'country'; // 'country' | 'province'
let currentProvince = null;

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
  const r = await fetch(url);
  const svgText = await r.text();
  container.innerHTML = svgText;
  // mejora: podrías inlinear atributos accesibles, etc.
}

function showCountryInfo() {
  currentLevel = 'country';
  currentProvince = null;
  
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

function onProvinceClick(provinceId) {
  const prov = data.provinces.find(x => x.id === provinceId);
  if (!prov) {
    console.warn('Provincia no encontrada en JSON: ', provinceId);
    return;
  }
  currentLevel = 'province';
  currentProvince = prov;
  
  // Actualizar información de la provincia en la sección correspondiente
  provinceNameEl.textContent = prov.name;
  provinceInfoEl.textContent = prov.info || 'Sin información disponible.';
  
  // Construir ruta completa para la bandera de la provincia
  const provinceFlagPath = prov.flag ? 
    (prov.flag.startsWith('http') ? prov.flag : config.provincesPath + prov.flag) : '';
  provinceFlagImg.src = provinceFlagPath;
  
  // Mostrar sección de provincia y ocultar sección del país
  countrySection.classList.add('hidden');
  provinceSection.classList.remove('hidden');
  backBtn.classList.remove('hidden');

  // opcional: si tenés un map provincial, lo podés cargar:
  if (prov.map) {
    const provinceMapPath = prov.map.startsWith('http') ? prov.map : config.mapsPath + prov.map;
    loadSVGInto(provinceMapPath, mapContainer).then(()=> {
      // si cargás un SVG provincial, podés añadir handlers a ciudades aquí
      // attachCityHandlers();
    });
  } else {
    // si no hay mapa provincial, podés hacer un zoom simple al path
    highlightProvince(provinceId);
  }
}

backBtn.addEventListener('click', () => {
  showCountryInfo();
  // recargar el mapa país (si lo reemplazaste)
  loadSVGInto(SVG_URL, mapContainer).then(attachProvinceHandlers);
});

function highlightProvince(id) {
  // ejemplo simple: dar un estilo al path seleccionado en el svg
  const svg = mapContainer.querySelector('svg');
  if (!svg) return;
  svg.querySelectorAll('.province').forEach(p => p.style.opacity = (p.id===id? '1':'0.4'));
}

window.addEventListener('DOMContentLoaded', init);
