/* ================= CONTROL DEL CARRUSEL ================= */
let slideActual = 0;
const slides = document.querySelectorAll('.mi-slide');
const indicadores = document.querySelectorAll('.carousel-indicators button');

function mostrarSlide(n) {
if (!slides.length) return;
slides.forEach((slide, index) => {
slide.style.display = 'none';
slide.classList.remove('active');
if (indicadores[index]) indicadores[index].classList.remove('active');
});

slideActual = (n + slides.length) % slides.length;
slides[slideActual].style.display = 'block';
slides[slideActual].classList.add('active');
if (indicadores[slideActual]) indicadores[slideActual].classList.add('active');
}

function cambiarSlide(direccion) {
mostrarSlide(slideActual + direccion);
}

function irASlide(n) {
mostrarSlide(n);
}

setInterval(() => {
cambiarSlide(1);
}, 5000);

/* ================= NAVEGACIÓN ENTRE SECCIONES Y VISTAS ================= */
let seccionAnterior = 'inicio';
let enVistaCatalogoCompleto = false;
let volverACatalogoCompleto = false;

function mostrarSeccion(nombreSeccion, elementoNav) {
document.getElementById('seccion-inicio').classList.add('seccion-oculta');
document.getElementById('seccion-categorias').classList.add('seccion-oculta');
document.getElementById('seccion-ofertas').classList.add('seccion-oculta');
document.getElementById('seccion-detalle-producto').classList.add('seccion-oculta');
document.getElementById('seccion-contacto').classList.add('seccion-oculta');

document.getElementById('seccion-' + nombreSeccion).classList.remove('seccion-oculta');

if (nombreSeccion !== 'detalle-producto') {
seccionAnterior = nombreSeccion;
}

if (elementoNav) {
document.querySelectorAll('.navbar-nav .nav-link').forEach(link => link.classList.remove('active'));
elementoNav.classList.add('active');
}

if (nombreSeccion === 'ofertas') {
cargarSeccionOfertas();
}
}

function volverDesdeDetalle() {
if (volverACatalogoCompleto) {
volverACatalogoCompleto = false;
activarVistaCatalogoCompleto(false);
return;
}
const btnNav = document.getElementById('btn-nav-' + seccionAnterior);
mostrarSeccion(seccionAnterior, btnNav);
}

/* ================= CAMBIO COMPLETO DE PÁGINA ("MOSTRAR MÁS") ================= */
async function activarVistaCatalogoCompleto(reiniciarFiltro = true) {
enVistaCatalogoCompleto = true;
document.body.classList.add('modo-catalogo-completo');
document.getElementById('vista-principal').classList.add('d-none');
document.getElementById('vista-catalogo-completo').classList.remove('d-none');

if (reiniciarFiltro) {
const primeraPill = document.querySelector('#pills-categorias-full .pill-categoria-va');
await filtrarCatalogoCompleto('todas', primeraPill);
}

window.scrollTo({ top: 0, behavior: 'smooth' });
}

function salirVistaCatalogoCompleto() {
enVistaCatalogoCompleto = false;
volverACatalogoCompleto = false;
document.body.classList.remove('modo-catalogo-completo');
document.getElementById('vista-catalogo-completo').classList.add('d-none');
document.getElementById('vista-principal').classList.remove('d-none');
mostrarSeccion('inicio', document.getElementById('btn-nav-inicio'));
window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function filtrarCatalogoCompleto(categoriaSeleccionada, botonPill) {
if (botonPill) {
document.querySelectorAll('#pills-categorias-full .pill-categoria-va').forEach(btn => {
btn.classList.remove('active');
});
botonPill.classList.add('active');
}

const grid = document.getElementById('grid-catalogo-full');
const contador = document.getElementById('contador-catalogo-full');
if (!grid) return;

const productos = await obtenerCatalogo();
const entradas = Object.entries(productos);

const filtrados = categoriaSeleccionada === 'todas'
? entradas
: entradas.filter(([, p]) => normalizarTexto(p.categoria) === normalizarTexto(categoriaSeleccionada));

if (contador) {
const etiqueta = categoriaSeleccionada === 'todas' ? 'todas las categorías' : categoriaSeleccionada;
contador.textContent = `Mostrando ${filtrados.length} productos en ${etiqueta}`;
}

grid.innerHTML = filtrados
.map(([id, prod]) => crearTarjetaProducto(id, prod, 'col-12 col-sm-6 col-md-4 col-lg-3'))
.join('');
}

/* ================= CARGA INSTANTÁNEA DE DATOS PRECARGADOS ================= */
let cacheProductos = null;

const IMAGEN_RESPALDO = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect fill='%23f1f5f9' width='300' height='200'/%3E%3Ctext fill='%23475569' font-family='sans-serif' font-size='16' font-weight='bold' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EVitrineandoAndo.cl%3C/text%3E%3C/svg%3E";

async function obtenerCatalogo() {
if (cacheProductos) return cacheProductos;
try {
const res = await fetch(`productos.json?v=${Date.now()}`);
if (!res.ok) throw new Error('No se pudo cargar productos.json');
const data = await res.json();
cacheProductos = data.productos || {};
return cacheProductos;
} catch (e) {
console.error('Error cargando productos.json:', e);
return {};
}
}

function normalizarTexto(texto) {
return String(texto || '')
.normalize('NFD')
.replace(/[\u0300-\u036f]/g, '')
.toLowerCase()
.trim();
}

function crearTarjetaProducto(id, prod, colClass = 'col-12 col-md-4') {
const precioTexto = '$' + Number(prod.precio || 0).toLocaleString('es-CL');
const tieneNormal = prod.precioNormal && Number(prod.precioNormal) > Number(prod.precio);
const normalTexto = tieneNormal ? '$' + Number(prod.precioNormal).toLocaleString('es-CL') : '';
const descuento = tieneNormal ? Math.round(((prod.precioNormal - prod.precio) / prod.precioNormal) * 100) : 0;

const condicion = prod.condicion || 'Nuevo';
const claseCondicion = condicion === 'Usado' ? 'condicion-usado' : 'condicion-nuevo';
const numTiendas = Array.isArray(prod.ofertas) ? prod.ofertas.length : 1;

return `
<div class="${colClass}">
<div class="card h-100 border-0 rounded-4 shadow-sm overflow-hidden">
<div class="position-relative bg-white p-3 text-center">
<span class="badge bg-dark position-absolute top-0 start-0 m-3">${prod.tienda}</span>
${descuento > 0
? `<span class="badge bg-danger position-absolute top-0 end-0 m-3">-${descuento}%</span>`
: `<span class="badge bg-warning text-dark position-absolute top-0 end-0 m-3">${prod.categoria}</span>`
}
<img src="${prod.imagen}" onerror="this.src='${IMAGEN_RESPALDO}'" alt="${prod.titulo}" class="img-fluid" style="height: 165px; object-fit: contain;">
</div>
<div class="card-body d-flex flex-column bg-white">
<div class="d-flex justify-content-between align-items-center mb-1">
<span class="text-dark small fw-semibold text-uppercase">${prod.marca}</span>
<span class="badge-condicion ${claseCondicion}">${condicion}</span>
</div>
<h3 class="card-title fw-bold text-dark fs-6 mt-1">${prod.titulo}</h3>
<div class="mt-auto pt-3">
${tieneNormal ? `<div class="text-muted text-decoration-line-through small">${normalTexto}</div>` : ''}
<div class="fs-4 fw-bolder text-dark mb-2">${precioTexto}</div>
<button type="button" class="btn btn-warning w-100 fw-bold" onclick="cerrarBusqueda(); abrirProducto('${id}');">
Comparar en ${numTiendas} tiendas
</button>
</div>
</div>
</div>
</div>
`;
}

/* ================= 4 PRODUCTOS DESTACADOS EN INICIO ================= */
async function cargarDestacadosInicio(rotarAlAzar = false) {
const grid = document.getElementById('grid-inicio-destacados');
if (!grid) return;

const productos = await obtenerCatalogo();
let lista = Object.entries(productos);

if (rotarAlAzar) {
for (let i = lista.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[lista[i], lista[j]] = [lista[j], lista[i]];
}
} else {
const destacados = lista.filter(([, p]) => p.destacado);
const otros = lista.filter(([, p]) => !p.destacado);
lista = destacados.concat(otros);
}

const seleccion4 = lista.slice(0, 4);
grid.innerHTML = seleccion4
.map(([id, prod]) => crearTarjetaProducto(id, prod, 'col-12 col-sm-6 col-lg-3'))
.join('');
}

/* ================= LAS 8 CATEGORÍAS ================= */
async function abrirCategoria(nombreCategoria, icono = '📦') {
const seccion = document.getElementById('seccion-subcategoria');
const tituloEl = document.getElementById('subcategoria-titulo');
const subtituloEl = document.getElementById('subcategoria-subtitulo');
const grid = document.getElementById('grid-subcategoria');

tituloEl.textContent = `${icono} ${nombreCategoria}`;

const productos = await obtenerCatalogo();
const catNorm = normalizarTexto(nombreCategoria);
const coincidencias = Object.entries(productos).filter(([, p]) =>
normalizarTexto(p.categoria) === catNorm
);

subtituloEl.textContent = `Mostrando ${coincidencias.length} productos disponibles con comparativa multitienda`;
grid.innerHTML = coincidencias
.map(([id, prod]) => crearTarjetaProducto(id, prod, 'col-12 col-md-4'))
.join('');

seccion.classList.remove('d-none');
seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cerrarSubcategoria() {
const seccion = document.getElementById('seccion-subcategoria');
if (seccion) seccion.classList.add('d-none');
}

/* ================= SECCIÓN OFERTAS ================= */
async function cargarSeccionOfertas() {
const grid = document.getElementById('grid-ofertas');
const subtitulo = document.getElementById('subtitulo-ofertas');
if (!grid) return;

const productos = await obtenerCatalogo();
const ofertas = Object.entries(productos).filter(([, p]) =>
p.precioNormal && Number(p.precioNormal) > Number(p.precio)
);

subtitulo.textContent = `${ofertas.length} productos con precio rebajado encontrados`;
grid.innerHTML = ofertas
.map(([id, prod]) => crearTarjetaProducto(id, prod, 'col-12 col-md-4'))
.join('');
}

/* ================= BUSCADOR Y FILTROS ================= */
function cerrarBusqueda() {
const seccion = document.getElementById('seccion-busqueda');
if (seccion) seccion.classList.add('d-none');
}

async function prepararSelectorTiendas() {
const selectTienda = document.getElementById('filtro-tienda');
if (!selectTienda || selectTienda.options.length > 1) return;

const productos = await obtenerCatalogo();
const setTiendas = new Set();
Object.values(productos).forEach(p => {
if (Array.isArray(p.ofertas)) {
p.ofertas.forEach(o => setTiendas.add(o.tienda));
}
});

[...setTiendas].sort().forEach(tienda => {
const opt = document.createElement('option');
opt.value = tienda;
opt.textContent = tienda;
selectTienda.appendChild(opt);
});
}

async function buscarProductos(termino) {
await prepararSelectorTiendas();
document.getElementById('filtro-palabra').value = termino.trim();
document.getElementById('filtro-categoria').value = 'todas';
document.getElementById('filtro-condicion').value = 'todos';
document.getElementById('filtro-precio-min').value = '';
document.getElementById('filtro-precio-max').value = '';
document.getElementById('filtro-tienda').value = 'todas';

await aplicarFiltrosBusqueda();

cerrarSubcategoria();
const seccion = document.getElementById('seccion-busqueda');
seccion.classList.remove('d-none');
seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function abrirExploradorCompleto() {
await buscarProductos('');
}

async function aplicarFiltrosBusqueda() {
const productos = await obtenerCatalogo();

const palabra = normalizarTexto(document.getElementById('filtro-palabra').value);
const categoria = document.getElementById('filtro-categoria').value;
const condicion = document.getElementById('filtro-condicion').value;
const precioMin = Number(document.getElementById('filtro-precio-min').value);
const precioMax = Number(document.getElementById('filtro-precio-max').value);
const tienda = document.getElementById('filtro-tienda').value;
const orden = document.getElementById('orden-busqueda').value;

let filtrados = Object.entries(productos).filter(([, p]) => {
const cumplePalabra = !palabra ||
normalizarTexto(p.titulo).includes(palabra) ||
normalizarTexto(p.categoria).includes(palabra) ||
normalizarTexto(p.marca).includes(palabra) ||
normalizarTexto(p.descripcion).includes(palabra);

const cumpleCat = categoria === 'todas' || normalizarTexto(p.categoria) === normalizarTexto(categoria);
const cumpleCond = condicion === 'todos' || (p.condicion || 'Nuevo') === condicion;
const cumpleMin = (!precioMin || precioMin <= 0) || Number(p.precio) >= precioMin;
const cumpleMax = (!precioMax || precioMax <= 0) || Number(p.precio) <= precioMax;
const cumpleTienda = tienda === 'todas' || (Array.isArray(p.ofertas) && p.ofertas.some(o => o.tienda === tienda));

return cumplePalabra && cumpleCat && cumpleCond && cumpleMin && cumpleMax && cumpleTienda;
});

if (orden === 'menor') {
filtrados.sort(([, a], [, b]) => Number(a.precio) - Number(b.precio));
} else if (orden === 'mayor') {
filtrados.sort(([, a], [, b]) => Number(b.precio) - Number(a.precio));
} else if (orden === 'descuento') {
filtrados.sort(([, a], [, b]) => {
const descA = a.precioNormal ? (a.precioNormal - a.precio) / a.precioNormal : 0;
const descB = b.precioNormal ? (b.precioNormal - b.precio) / b.precioNormal : 0;
return descB - descA;
});
}

document.getElementById('titulo-busqueda').textContent = palabra
? `Resultados para "${document.getElementById('filtro-palabra').value}"`
: 'Catálogo General';
document.getElementById('contador-busqueda').textContent = `${filtrados.length} ${filtrados.length === 1 ? 'resultado' : 'resultados'}`;
document.getElementById('subtitulo-busqueda').textContent = `Mostrando ${filtrados.length} productos`;

const grid = document.getElementById('grid-busqueda');
if (filtrados.length === 0) {
grid.innerHTML = `
<div class="col-12 text-center py-5">
<p class="text-dark fw-bold fs-5 mb-1">No hay productos que coincidan con los filtros aplicados.</p>
<p class="text-muted small mb-0">Haz clic en "BORRAR FILTROS" para restablecer la búsqueda.</p>
</div>
`;
return;
}

grid.innerHTML = filtrados
.map(([id, prod]) => crearTarjetaProducto(id, prod, 'col-12 col-md-4'))
.join('');
}

function limpiarFiltrosBusqueda() {
document.getElementById('filtro-palabra').value = '';
document.getElementById('filtro-categoria').value = 'todas';
document.getElementById('filtro-condicion').value = 'todos';
document.getElementById('filtro-precio-min').value = '';
document.getElementById('filtro-precio-max').value = '';
document.getElementById('filtro-tienda').value = 'todas';
document.getElementById('orden-busqueda').value = 'menor';
aplicarFiltrosBusqueda();
}

/* ================= FICHA DE PRODUCTO Y COMPARADOR ================= */
let instanciaGraficoPrecios = null;

function obtenerClaseLogoTienda(nombreTienda) {
const clave = normalizarTexto(nombreTienda).replace(/\s+/g, '');
if (clave.includes('falabella')) return 'logo-falabella';
if (clave.includes('paris')) return 'logo-paris';
if (clave.includes('ripley')) return 'logo-ripley';
if (clave.includes('mercadolibre')) return 'logo-mercadolibre';
if (clave.includes('lapolar')) return 'logo-lapolar';
if (clave.includes('dafiti')) return 'logo-dafiti';
if (clave.includes('sodimac')) return 'logo-sodimac';
if (clave.includes('easy')) return 'logo-easy';
if (clave.includes('lider')) return 'logo-lider';
if (clave.includes('jumbo')) return 'logo-jumbo';
if (clave.includes('yapo')) return 'logo-yapo';
return 'logo-default';
}

function renderizarGraficoHistorial(historial, ofertasActuales) {
const canvas = document.getElementById('grafico-historial-precios');
if (!canvas || typeof Chart === 'undefined') return;

if (instanciaGraficoPrecios) {
instanciaGraficoPrecios.destroy();
}

const paleta = ['#492282', '#0f766e', '#d97706', '#2563eb', '#dc2626'];
const registros = (Array.isArray(historial) && historial.length > 0)
? historial
: [{ fecha: 'Actual', precios: Object.fromEntries(ofertasActuales.map(o => [o.tienda, o.precio])) }];

const etiquetasFechas = registros.map(r => r.fecha);
const tiendasUnicas = [...new Set(ofertasActuales.map(o => o.tienda))];

const datasets = tiendasUnicas.map((tienda, idx) => ({
label: tienda,
data: registros.map(r => (r.precios && r.precios[tienda] !== undefined) ? r.precios[tienda] : null),
borderColor: paleta[idx % paleta.length],
backgroundColor: paleta[idx % paleta.length],
borderWidth: 2.5,
pointRadius: 4,
tension: 0.25,
spanGaps: true
}));

instanciaGraficoPrecios = new Chart(canvas, {
type: 'line',
data: { labels: etiquetasFechas, datasets },
options: {
responsive: true,
maintainAspectRatio: false,
interaction: { mode: 'index', intersect: false },
plugins: {
legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
tooltip: {
callbacks: {
label: (ctx) => ctx.parsed.y === null
? `${ctx.dataset.label}: Sin datos`
: `${ctx.dataset.label}: $${Number(ctx.parsed.y).toLocaleString('es-CL')}`
}
}
},
scales: {
x: { ticks: { font: { size: 10 } } },
y: {
ticks: {
font: { size: 10 },
callback: (val) => '$' + Number(val).toLocaleString('es-CL')
}
}
}
}
});
}

async function abrirProducto(idProducto) {
if (enVistaCatalogoCompleto) {
volverACatalogoCompleto = true;
enVistaCatalogoCompleto = false;
document.body.classList.remove('modo-catalogo-completo');
document.getElementById('vista-catalogo-completo').classList.add('d-none');
document.getElementById('vista-principal').classList.remove('d-none');
}

mostrarSeccion('detalle-producto', null);
window.scrollTo({ top: 0, behavior: 'smooth' });

const imgEl = document.getElementById('detalle-img');
const tituloEl = document.getElementById('detalle-titulo');
const descEl = document.getElementById('detalle-descripcion');
const marcaEl = document.getElementById('detalle-marca');
const catEl = document.getElementById('detalle-categoria');
const condEl = document.getElementById('detalle-condicion');
const headerLogos = document.getElementById('comparador-logos-header');
const listaTiendas = document.getElementById('lista-tiendas-comparador');

const productos = await obtenerCatalogo();
const producto = productos[idProducto];
if (!producto) return;

imgEl.onerror = () => { imgEl.src = IMAGEN_RESPALDO; };
imgEl.src = producto.imagen;
tituloEl.textContent = producto.titulo;
descEl.textContent = producto.descripcion;
marcaEl.textContent = producto.marca;
catEl.textContent = producto.categoria;

const condicion = producto.condicion || 'Nuevo';
condEl.textContent = condicion;
condEl.className = `badge-condicion ${condicion === 'Usado' ? 'condicion-usado' : 'condicion-nuevo'}`;

const ofertas = [...(producto.ofertas || [])].sort((a, b) => a.precio - b.precio);

headerLogos.innerHTML = ofertas.map(o => `
<span class="logo-tienda ${obtenerClaseLogoTienda(o.tienda)}">${o.tienda}</span>
`).join('');

listaTiendas.innerHTML = ofertas.map((oferta, index) => {
const esMejor = index === 0;
const precioFormateado = '$' + Number(oferta.precio).toLocaleString('es-CL');

return `
<div class="fila-tienda ${esMejor ? 'fila-mejor-opcion' : ''}">
<div class="d-flex align-items-center gap-2 flex-wrap">
${!esMejor ? `<span class="logo-tienda ${obtenerClaseLogoTienda(oferta.tienda)}">${oferta.tienda}</span>` : ''}
<span class="fs-5 fw-bolder text-dark">${precioFormateado}</span>
${esMejor ? `<span class="badge-mejor-opcion">MEJOR OPCIÓN</span>` : ''}
</div>
<a href="${oferta.url}" target="_blank" rel="noopener noreferrer" class="btn-ir-tienda" aria-label="Ir a tienda ${oferta.tienda} por ${precioFormateado}">
Ir a Tienda
</a>
</div>
`;
}).join('');

renderizarGraficoHistorial(producto.historial, ofertas);
}

/* ================= INICIALIZACIÓN Y FORMULARIO DE CONTACTO ================= */
document.addEventListener('DOMContentLoaded', () => {
cargarDestacadosInicio(false);

const formBuscador = document.getElementById('form-buscador');
if (formBuscador) {
formBuscador.addEventListener('submit', (e) => {
e.preventDefault();
const input = document.getElementById('input-buscador');
buscarProductos(input ? input.value : '');
});
}

const btnToggler = document.querySelector('.navbar-toggler');
const menuNav = document.getElementById('menuNavegacion');

function cerrarMenuMovil() {
if (!menuNav) return;
if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
const instancia = bootstrap.Collapse.getInstance(menuNav);
if (instancia) instancia.hide();
} else {
menuNav.classList.remove('show');
if (btnToggler) btnToggler.setAttribute('aria-expanded', 'false');
}
}

if (btnToggler && menuNav) {
btnToggler.addEventListener('click', () => {
if (typeof bootstrap === 'undefined') {
menuNav.classList.toggle('show');
btnToggler.setAttribute('aria-expanded', menuNav.classList.contains('show'));
}
});
}

document.querySelectorAll('.navbar-nav .nav-link').forEach(enlace => {
enlace.addEventListener('click', () => {
cerrarBusqueda();
cerrarSubcategoria();
cerrarMenuMovil();
});
});

function enviarFormularioContacto(event) {
event.preventDefault();
const alerta = document.getElementById('alerta-contacto');
alerta.classList.remove('d-none');
event.target.reset();

setTimeout(() => {
alerta.classList.add('d-none');
}, 4500);
}
