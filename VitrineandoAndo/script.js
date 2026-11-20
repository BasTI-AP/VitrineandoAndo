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
					<img src="${prod.imagen}" alt="${prod.titulo}" class="img/* ================= CONTROL DEL CARRUSEL ================= */
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
}, 4000);

/* ================= ALTERNAR ENTRE SECCIONES ================= */
let seccionAnterior = 'inicio';

function ocultarTodasLasSecciones() {
	const ids = [
		'seccion-inicio',
		'seccion-categorias',
		'seccion-busqueda',
		'seccion-ofertas',
		'seccion-detalle-producto',
		'seccion-contacto'
	];
	ids.forEach(id => {
		const el = document.getElementById(id);
		if (el) el.classList.add('seccion-oculta');
	});

	// Cierra automáticamente la ventana de Supermercado al cambiar de sección
	cerrarSupermercado();
}

function mostrarSeccion(nombreSeccion, elementoNav) {
	ocultarTodasLasSecciones();

	const destino = document.getElementById('seccion-' + nombreSeccion);
	if (destino) destino.classList.remove('seccion-oculta');

	if (nombreSeccion !== 'busqueda' && nombreSeccion !== 'detalle-producto') {
		seccionAnterior = nombreSeccion;
	}

	if (elementoNav) {
		document.querySelectorAll('.navbar-nav .nav-link').forEach(link => link.classList.remove('active'));
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
		descEl.textContent = 'No se pudo obtener la información del producto.';
		console.error(error);
	}
}

/* ================= SUB-SECCIÓN INDEPENDIENTE: SUPERMERCADO ================= */
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

function mostrarSupermercado() {
	const seccion = document.getElementById('seccion-supermercado');
	const grid = document.getElementById('grid-supermercado');
	if (!seccion || !grid) return;

	grid.innerHTML = PRODUCTOS_SUPERMERCADO.map(prod => `
		<div class="col-12 col-md-4">
			<div class="card h-100 border-0 rounded-4 shadow-sm overflow-hidden">
				<div class="position-relative bg-white p-3 text-center">
					<span class="badge bg-dark position-absolute top-0 start-0 m-3">${prod.tienda}</span>
					<img src="${prod.imagen}" alt="${prod.nombre}" class="img-fluid" style="height: 170px; object-fit: contain;">
				</div>
				<div class="card-body d-flex flex-column bg-white">
					<span class="text-muted small fw-semibold text-uppercase">${prod.marca}</span>
					<h5 class="card-title fw-bold text-dark fs-6 mt-1">${prod.nombre}</h5>
					<div class="mt-auto pt-3">
						<div class="text-muted text-decoration-line-through small">${prod.precioNormal}</div>
						<div class="fs-4 fw-bolder text-dark mb-2">${prod.precioOferta}</div>
						<a href="${prod.url}" target="_blank" rel="noopener noreferrer" class="btn btn-warning w-100 fw-bold">
							Ver producto
						</a>
					</div>
				</div>
			</div>
		</div>
	`).join('');

	seccion.classList.remove('d-none');
	seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cerrarSupermercado() {
	const seccion = document.getElementById('seccion-supermercado');
	if (seccion) seccion.classList.add('d-none');
}

/* ================= BUSCADOR CON FILTROS LATERALES ================= */
let catalogoBusqueda = [];
let topeMaximoCatalogo = 200000;

function normalizarTexto(texto) {
	return String(texto || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
}

function cerrarBusqueda() {
	const btnNav = document.getElementById('btn-nav-' + seccionAnterior);
	mostrarSeccion(seccionAnterior, btnNav);
}

async function cargarCatalogoParaBusqueda() {
	let lista = [];

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

	if (typeof PRODUCTOS_SUPERMERCADO !== 'undefined') {
		const desdeSuper = PRODUCTOS_SUPERMERCADO.map(p => ({
			titulo: p.nombre,
			marca: p.marca,
			tienda: p.tienda,
			categoria: 'Supermercado',
			precioNum: Number(String(p.precioOferta).replace(/\D/g, '')) || 0,
			precioTexto: p.precioOferta,
			precioNormal: p.precioNormal || '',
			imagen: p.imagen,
			url: p.url
		}));
		lista = lista.concat(desdeSuper);
	}

	catalogoBusqueda = lista;

	const mayorPrecio = lista.reduce((max, item) => Math.max(max, item.precioNum), 0);
	topeMaximoCatalogo = mayorPrecio > 0 ? Math.ceil(mayorPrecio / 5000) * 5000 : 200000;
}

function actualizarSliderPrecio(quienMovio) {
	const sliderMin = document.getElementById('rango-min');
	const sliderMax = document.getElementById('rango-max');
	const fill = document.getElementById('dual-slider-fill');
	const textoRango = document.getElementById('texto-rango-precio');

	let valMin = Number(sliderMin.value);
	let valMax = Number(sliderMax.value);
	const pasoMinimo = 500;

	if (valMax - valMin < pasoMinimo) {
		if (quienMovio === 'min') {
			valMin = Math.max(0, valMax - pasoMinimo);
			sliderMin.value = valMin;
		} else {
			valMax = Math.min(topeMaximoCatalogo, valMin + pasoMinimo);
			sliderMax.value = valMax;
		}
	}

	const porcentajeMin = (valMin / topeMaximoCatalogo) * 100;
	const porcentajeMax = (valMax / topeMaximoCatalogo) * 100;

	fill.style.left = porcentajeMin + '%';
	fill.style.width = (porcentajeMax - porcentajeMin) + '%';
	textoRango.textContent = `$${valMin.toLocaleString('es-CL')} - $${valMax.toLocaleString('es-CL')}`;

	aplicarFiltrosBusqueda(false);
}

async function abrirBusqueda(termino) {
	await cargarCatalogoParaBusqueda();

	document.getElementById('busqueda-titulo').textContent = `Resultados para "${termino}"`;
	document.getElementById('filtro-categoria').value = 'todas';
	document.getElementById('filtro-palabras').value = termino;
	document.getElementById('orden-precio').value = 'defecto';

	const sliderMin = document.getElementById('rango-min');
	const sliderMax = document.getElementById('rango-max');
	sliderMin.max = topeMaximoCatalogo;
	sliderMax.max = topeMaximoCatalogo;
	sliderMin.value = 0;
	sliderMax.value = topeMaximoCatalogo;

	actualizarSliderPrecio('max');
	aplicarFiltrosBusqueda(true);
	mostrarSeccion('busqueda', null);
}

function actualizarDesplegables(productosBase) {
	const selectTienda = document.getElementById('filtro-tienda');
	const selectMarca = document.getElementById('filtro-marca');

	const tiendaPrevia = selectTienda.value;
	const marcaPrevia = selectMarca.value;

	const tiendasUnicas = [...new Set(productosBase.map(p => p.tienda).filter(Boolean))];
	selectTienda.innerHTML = `<option value="todas">Tiendas (Todas)</option>` +
		tiendasUnicas.map(t => `<option value="${t}">${t}</option>`).join('');
	if (tiendasUnicas.includes(tiendaPrevia)) selectTienda.value = tiendaPrevia;

	const marcasUnicas = [...new Set(productosBase.map(p => p.marca).filter(Boolean))];
	selectMarca.innerHTML = `<option value="todas">Marcas (Todas)</option>` +
		marcasUnicas.map(m => `<option value="${m}">${m}</option>`).join('');
	if (marcasUnicas.includes(marcaPrevia)) selectMarca.value = marcaPrevia;
}

function aplicarFiltrosBusqueda(recalcularListas = false) {
	const catElegida = document.getElementById('filtro-categoria').value;
	const query = normalizarTexto(document.getElementById('filtro-palabras').value);
	const orden = document.getElementById('orden-precio').value;

	let base = catalogoBusqueda.filter(prod => {
		const cumpleCat = (catElegida === 'todas') || (prod.categoria === catElegida);
		const cumpleBusqueda = !query ||
			normalizarTexto(prod.titulo).includes(query) ||
			normalizarTexto(prod.marca).includes(query) ||
			normalizarTexto(prod.tienda).includes(query) ||
			normalizarTexto(prod.categoria).includes(query);

		return cumpleCat && cumpleBusqueda;
	});

	if (recalcularListas) {
		actualizarDesplegables(base);
	}

	const tiendaElegida = document.getElementById('filtro-tienda').value;
	const marcaElegida = document.getElementById('filtro-marca').value;
	const precioMin = Number(document.getElementById('rango-min').value);
	const precioMax = Number(document.getElementById('rango-max').value);

	let filtrados = base.filter(prod => {
		const cumpleTienda = (tiendaElegida === 'todas') || (prod.tienda === tiendaElegida);
		const cumpleMarca = (marcaElegida === 'todas') || (prod.marca === marcaElegida);
		const cumplePrecio = (prod.precioNum >= precioMin) && (prod.precioNum <= precioMax);
		return cumpleTienda && cumpleMarca && cumplePrecio;
	});

	if (orden === 'menor') {
		filtrados.sort((a, b) => a.precioNum - b.precioNum);
	} else if (orden === 'mayor') {
		filtrados.sort((a, b) => b.precioNum - a.precioNum);
	} else if (orden === 'az') {
		filtrados.sort((a, b) => a.titulo.localeCompare(b.titulo));
	}

	const textoResultados = `${filtrados.length} ${filtrados.length === 1 ? 'resultado' : 'resultados'}`;
	document.getElementById('busqueda-contador').textContent = textoResultados;
	document.getElementById('busqueda-subtitulo').textContent = `1 - ${filtrados.length} de ${filtrados.length}`;

	const grid = document.getElementById('grid-busqueda');
	if (filtrados.length === 0) {
		grid.innerHTML = `
			<div class="col-12 text-center py-5">
				<p class="text-dark fw-bold fs-5 mb-1">No encontramos productos con esos filtros.</p>
				<small class="text-muted">Haz clic en "BORRAR FILTROS" a la izquierda para restablecer la búsqueda.</small>
			</div>
		`;
		return;
	}

	grid.innerHTML = filtrados.map(prod => `
		<div class="col-12 col-sm-6 col-md-4 col-xl-3">
			<div class="border rounded-3 h-100 d-flex flex-column p-3 bg-white shadow-sm">
				<div class="d-flex justify-content-between align-items-center mb-2">
					<span class="badge border text-warning-emphasis bg-warning-subtle fw-semibold" style="font-size: 0.7rem;">
						${prod.tienda}
					</span>
					<small class="text-muted" style="font-size: 0.7rem;">${prod.categoria}</small>
				</div>

				<div class="text-center my-2">
					<img src="${prod.imagen}" alt="${prod.titulo}" class="img-fluid" style="height: 135px; object-fit: contain;">
				</div>

				<h6 class="fw-bold text-dark mb-2" style="font-size: 0.88rem; line-height: 1.3;">
					${prod.titulo}
				</h6>

				<div class="mb-2">
					<span class="d-block text-muted" style="font-size: 0.72rem;">Desde:</span>
					<span class="fs-5 fw-bolder text-dark">${prod.precioTexto}</span>
					${prod.precioNormal ? `<small class="text-muted text-decoration-line-through ms-1">${prod.precioNormal}</small>` : ''}
				</div>

				<div class="text-muted mb-3" style="font-size: 0.75rem; line-height: 1.4;">
					<div><strong class="text-dark">Marca:</strong> ${prod.marca}</div>
					<div><strong class="text-dark">Tienda:</strong> ${prod.tienda}</div>
				</div>

				<a href="${prod.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm text-white fw-bold text-uppercase mt-auto w-100" style="background-color: #f39c12; font-size: 0.75rem; letter-spacing: 0.5px;">
					Ver producto
				</a>
			</div>
		</div>
	`).join('');
}

function limpiarFiltrosBusqueda() {
	document.getElementById('filtro-tienda').value = 'todas';
	document.getElementById('filtro-marca').value = 'todas';
	document.getElementById('filtro-palabras').value = '';
	document.getElementById('orden-precio').value = 'defecto';

	const sliderMin = document.getElementById('rango-min');
	const sliderMax = document.getElementById('rango-max');
	sliderMin.value = 0;
	sliderMax.value = topeMaximoCatalogo;
	actualizarSliderPrecio('max');
}

/* ================= CONECTAR BUSCADOR SUPERIOR ================= */
document.addEventListener('DOMContentLoaded', () => {
	const formBuscador = document.getElementById('form-buscador');
	if (formBuscador) {
		formBuscador.addEventListener('submit', (e) => {
			e.preventDefault();
			const input = document.getElementById('input-buscador');
			const texto = input ? input.value.trim() : '';
			if (!texto) return;

			abrirBusqueda(texto);
		});
	}
});
