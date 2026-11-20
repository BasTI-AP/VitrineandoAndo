/* ================= CONTROL DEL CARRUSEL ================= */
let slideActual = 0;
const slides = document.querySelectorAll('.mi-slide');
const indicadores = document.querySelectorAll('.carousel-indicators button');

function mostrarSlide(n) {
	slides.forEach((slide, index) => {
		slide.style.display = 'none';
		slide.classList.remove('active');
		indicadores[index].classList.remove('active');
	});

	slideActual = (n + slides.length) % slides.length;
	
	slides[slideActual].style.display = 'block';
	slides[slideActual].classList.add('active');
	indicadores[slideActual].classList.add('active');
}

function cambiarSlide(direccion) {
	mostrarSlide(slideActual + direccion);
}

function irASlide(n) {
	mostrarSlide(n);
}

setInterval(() => {
	cambiarSlide(1);
}, 4000);

/* ================= ALTERNAR ENTRE SECCIONES ================= */
function mostrarSeccion(nombreSeccion, elementoNav) {
	// Ocultar todas las secciones existentes 
	document.getElementById('seccion-inicio').classList.add('seccion-oculta');
	document.getElementById('seccion-categorias').classList.add('seccion-oculta');
	document.getElementById('seccion-ofertas').classList.add('seccion-oculta');
	document.getElementById('seccion-detalle-producto').classList.add('seccion-oculta');
	document.getElementById('seccion-contacto').classList.add('seccion-oculta');

	// Mostrar la sección solicitada
	document.getElementById('seccion-' + nombreSeccion).classList.remove('seccion-oculta');

	// Actualizar la clase 'active' en el menú de navegación 
	if (elementoNav) {
		const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
		navLinks.forEach(link => link.classList.remove('active'));
		elementoNav.classList.add('active');
	}
}

/* ================= CARGAR PRODUCTO EXTERNO ================= */
async function abrirProducto(idProducto) {
	mostrarSeccion('detalle-producto', null);

	const imgEl = document.getElementById('detalle-img');
	const tituloEl = document.getElementById('detalle-titulo');
	const precioEl = document.getElementById('detalle-precio');
	const descEl = document.getElementById('detalle-descripcion');

	try {
		// El parámetro ?t= evita que el navegador use una versión vieja en caché
		const respuesta = await fetch(`productos.json?t=${Date.now()}`);
		if (!respuesta.ok) throw new Error('No se pudo cargar productos.json');

		const data = await respuesta.json();
		const producto = data.productos[idProducto];

		if (!producto) throw new Error('Producto no encontrado');

		imgEl.src = producto.imagen;
		imgEl.style.display = 'inline-block';
		tituloEl.textContent = producto.titulo;
		precioEl.textContent = '$' + Number(producto.precio).toLocaleString('es-CL');
		descEl.textContent = producto.descripcion;

	} catch (error) {
		tituloEl.textContent = 'Error al cargar el producto';
		precioEl.textContent = '---';
		descEl.textContent = 'Abre la página desde GitHub Pages o un servidor local (Live Server).';
		console.error(error);
	}
}


/* ============================ BOSQUEJO SUPERMERCADO ================================ */
const PRODUCTOS_SUPERMERCADO = [
	{
		tienda: 'Jumbo',
		marca: 'Colun',
		nombre: 'Leche Entera Natural 1 L',
		precioNormal: '$1.390',
		precioOferta: '$1.090',
		imagen: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80',
		url: 'https://www.jumbo.cl/'
	},
	{
		tienda: 'Lider',
		marca: 'Miraflores',
		nombre: 'Arroz Grado 1 Largo Ancho 1 kg',
		precioNormal: '$1.890',
		precioOferta: '$1.450',
		imagen: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
		url: 'https://www.lider.cl/'
	},
	{
		tienda: 'Santa Isabel',
		marca: 'Chef',
		nombre: 'Aceite Vegetal 100% Maravilla 1 L',
		precioNormal: '$2.790',
		precioOferta: '$2.190',
		imagen: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
		url: 'https://www.santaisabel.cl/'
	}
];

/* =================== VITRINA UNIVERSAL Y FILTROS ================ */
let catalogoGlobal = [];
let contextoActual = {
	terminoBusqueda: '',
	soloOfertas: false
};

function normalizarTexto(texto) {
	return String(texto || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
}

function cerrarVitrina() {
	const seccion = document.getElementById('seccion-vitrina');
	if (seccion) seccion.classList.add('d-none');
}

// Compatibilidad por si algún botón en index.html aún llama a las funciones antiguas
function mostrarSupermercado() {
	abrirVitrina({ titulo: '🛒 Supermercado', categoria: 'Supermercado' });
}
function cerrarSupermercado() {
	cerrarVitrina();
}

// 1. Unifica productos.json + PRODUCTOS_SUPERMERCADO en un solo formato estándar
async function cargarCatalogoUnificado() {
	let lista = [];

	// Productos automáticos desde productos.json (Falabella / Outlet)
	try {
		const res = await fetch(`productos.json?v=${Date.now()}`);
		if (res.ok) {
			const data = await res.json();
			const desdeJson = Object.values(data.productos || {}).map(p => {
				const precioNum = Number(p.precio || 0);
				return {
					titulo: p.titulo,
					marca: p.marca || 'Destacado',
					tienda: p.tienda || 'Falabella',
					categoria: p.categoria || 'Perfumería',
					esOferta: p.esOferta !== undefined ? p.esOferta : true,
					precioNum: precioNum,
					precioTexto: `$${precioNum.toLocaleString('es-CL')}`,
					precioNormal: p.precioNormal || '',
					imagen: p.imagen,
					url: p.url
				};
			});
			lista = lista.concat(desdeJson);
		}
	} catch (e) {
		console.warn('Error leyendo productos.json:', e);
	}

	// Productos de Supermercado definidos arriba en script.js
	if (typeof PRODUCTOS_SUPERMERCADO !== 'undefined') {
		const desdeSuper = PRODUCTOS_SUPERMERCADO.map(p => ({
			titulo: p.nombre,
			marca: p.marca,
			tienda: p.tienda,
			categoria: 'Supermercado',
			esOferta: true,
			precioNum: Number(String(p.precioOferta).replace(/\D/g, '')) || 0,
			precioTexto: p.precioOferta,
			precioNormal: p.precioNormal || '',
			imagen: p.imagen,
			url: p.url
		}));
		lista = lista.concat(desdeSuper);
	}

	catalogoGlobal = lista;
	return lista;
}

// 2. Abre la vitrina configurada según desde dónde hizo clic el usuario
async function abrirVitrina({ titulo = 'Catálogo', categoria = 'todas', soloOfertas = false, busqueda = '' } = {}) {
	await cargarCatalogoUnificado();

	contextoActual = {
		terminoBusqueda: busqueda,
		soloOfertas: soloOfertas
	};

	document.getElementById('vitrina-titulo').textContent = titulo;
	document.getElementById('filtro-categoria').value = categoria;
	document.getElementById('filtro-precio-min').value = '';
	document.getElementById('filtro-precio-max').value = '';
	document.getElementById('orden-precio').value = 'defecto';

	aplicarFiltrosGenerales(true);

	const seccion = document.getElementById('seccion-vitrina');
	seccion.classList.remove('d-none');
	seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 3. Actualiza las opciones del filtro "Tienda" según la categoría elegida
function actualizarOpcionesTiendas(productosBase) {
	const selectTienda = document.getElementById('filtro-tienda');
	const tiendaPrevia = selectTienda.value;

	const tiendasUnicas = [...new Set(productosBase.map(p => p.tienda).filter(Boolean))];
	selectTienda.innerHTML = `<option value="todas">Todas</option>` +
		tiendasUnicas.map(t => `<option value="${t}">${t}</option>`).join('');

	if (tiendasUnicas.includes(tiendaPrevia)) {
		selectTienda.value = tiendaPrevia;
	}
}

// 4. Filtra por categoría, tienda, rango de precio, orden y búsqueda
function aplicarFiltrosGenerales(recalcularTiendas = false) {
	const catElegida = document.getElementById('filtro-categoria').value;
	const orden = document.getElementById('orden-precio').value;
	const query = normalizarTexto(contextoActual.terminoBusqueda);

	// Filtro base (Categoría + Ofertas + Búsqueda)
	let base = catalogoGlobal.filter(prod => {
		const cumpleCat = (catElegida === 'todas') || (prod.categoria === catElegida);
		const cumpleOferta = !contextoActual.soloOfertas || prod.esOferta;
		const cumpleBusqueda = !query ||
			normalizarTexto(prod.titulo).includes(query) ||
			normalizarTexto(prod.marca).includes(query) ||
			normalizarTexto(prod.tienda).includes(query) ||
			normalizarTexto(prod.categoria).includes(query);

		return cumpleCat && cumpleOferta && cumpleBusqueda;
	});

	if (recalcularTiendas) {
		actualizarOpcionesTiendas(base);
	}

	// Filtro de Tienda y Rango de Precio (Mínimo y Máximo)
	const tiendaElegida = document.getElementById('filtro-tienda').value;
	const precioMin = Number(document.getElementById('filtro-precio-min').value);
	const precioMax = Number(document.getElementById('filtro-precio-max').value);

	let filtrados = base.filter(prod => {
		const cumpleTienda = (tiendaElegida === 'todas') || (prod.tienda === tiendaElegida);
		const cumpleMin = (!precioMin || precioMin <= 0) || (prod.precioNum >= precioMin);
		const cumpleMax = (!precioMax || precioMax <= 0) || (prod.precioNum <= precioMax);
		return cumpleTienda && cumpleMin && cumpleMax;
	});

	// Ordenar por precio
	if (orden === 'menor') {
		filtrados.sort((a, b) => a.precioNum - b.precioNum);
	} else if (orden === 'mayor') {
		filtrados.sort((a, b) => b.precioNum - a.precioNum);
	}

	// Actualizar contador
	const subtitulo = document.getElementById('vitrina-subtitulo');
	const textoBusq = contextoActual.terminoBusqueda ? ` para "${contextoActual.terminoBusqueda}"` : '';
	subtitulo.textContent = `Mostrando ${filtrados.length} ${filtrados.length === 1 ? 'producto' : 'productos'}${textoBusq}`;

	// Renderizar tarjetas
	const grid = document.getElementById('grid-vitrina');
	if (filtrados.length === 0) {
		const avisoRango = (precioMin > 0 && precioMax > 0 && precioMin > precioMax)
			? 'El precio mínimo no puede ser mayor que el precio máximo.'
			: 'Prueba ampliando el rango de precio o seleccionando "Todas" en tienda.';

		grid.innerHTML = `
			<div class="col-12 text-center py-4">
				<p class="text-white fs-5 mb-1">No hay productos que coincidan con estos filtros.</p>
				<small class="text-light opacity-75">${avisoRango}</small>
			</div>
		`;
		return;
	}

	grid.innerHTML = filtrados.map(prod => `
		<div class="col-12 col-md-4">
			<div class="card h-100 border-0 rounded-4 shadow-sm overflow-hidden">
				<div class="position-relative bg-white p-3 text-center">
					<span class="badge bg-dark position-absolute top-0 start-0 m-3">${prod.tienda}</span>
					<span class="badge bg-warning text-dark position-absolute top-0 end-0 m-3">${prod.categoria}</span>
					<img src="${prod.imagen}" alt="${prod.titulo}" class="img-fluid" style="height: 170px; object-fit: contain;">
				</div>
				<div class="card-body d-flex flex-column bg-white">
					<span class="text-muted small fw-semibold text-uppercase">${prod.marca}</span>
					<h5 class="card-title fw-bold text-dark fs-6 mt-1">${prod.titulo}</h5>
					<div class="mt-auto pt-3">
						${prod.precioNormal ? `<div class="text-muted text-decoration-line-through small">${prod.precioNormal}</div>` : ''}
						<div class="fs-4 fw-bolder text-dark mb-2">${prod.precioTexto}</div>
						<a href="${prod.url}" target="_blank" rel="noopener noreferrer" class="btn btn-warning w-100 fw-bold">
							Ver producto
						</a>
					</div>
				</div>
			</div>
		</div>
	`).join('');
}

function limpiarFiltros() {
	document.getElementById('filtro-tienda').value = 'todas';
	document.getElementById('filtro-precio-min').value = '';
	document.getElementById('filtro-precio-max').value = '';
	document.getElementById('orden-precio').value = 'defecto';
	aplicarFiltrosGenerales(false);
}

// 5. Conectar barra de búsqueda superior y cierre automático al cambiar de menú
document.addEventListener('DOMContentLoaded', () => {
	const formBuscador = document.querySelector('nav form, .navbar form');
	if (formBuscador) {
		formBuscador.addEventListener('submit', (e) => {
			e.preventDefault();
			const input = formBuscador.querySelector('input');
			const texto = input ? input.value.trim() : '';
			if (!texto) return;

			abrirVitrina({
				titulo: `🔍 Resultados de búsqueda`,
				categoria: 'todas',
				busqueda: texto
			});
		});
	}

	document.querySelectorAll('nav a, .navbar a').forEach(enlace => {
		enlace.addEventListener('click', () => {
			const textoEnlace = normalizarTexto(enlace.textContent);
			if (textoEnlace === 'ofertas') {
				abrirVitrina({ titulo: '🔥 Ofertas y Outlet', soloOfertas: true });
			} else {
				cerrarVitrina();
			}
		});
	});
});
