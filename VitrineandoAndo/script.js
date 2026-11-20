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

function mostrarSupermercado() {
	const seccion = document.getElementById('seccion-supermercado');
	const grid = document.getElementById('grid-supermercado');

	// Genera las 3 tarjetas de e-commerce
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

	// Muestra la sección y desliza la pantalla suavemente hacia ella
	seccion.classList.remove('d-none');
	seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cerrarSupermercado() {
	document.getElementById('seccion-supermercado').classList.add('d-none');
}


// Cierra la vitrina de Supermercado automáticamente al cambiar de pestaña o usar el buscador
document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('nav a, .navbar a').forEach(enlace => {
		enlace.addEventListener('click', () => {
			cerrarSupermercado();
		});
	});

	const buscador = document.querySelector('nav form, .navbar form');
	if (buscador) {
		buscador.addEventListener('submit', () => {
			cerrarSupermercado();
		});
	}
});

/* =================== BUSCADOR ================ */
function normalizarTexto(texto) {
	return String(texto || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
}

function cerrarBusqueda() {
	const seccion = document.getElementById('seccion-busqueda');
	if (seccion) seccion.classList.add('d-none');
}

async function buscarProductos(termino) {
	const query = normalizarTexto(termino);
	if (!query) return;

	const seccion = document.getElementById('seccion-busqueda');
	const grid = document.getElementById('grid-busqueda');
	const subtitulo = document.getElementById('subtitulo-busqueda');

	let catalogoUnificado = [];

	// 1. Cargar productos actualizados por el bot desde productos.json
	try {
		const respuesta = await fetch(`productos.json?v=${Date.now()}`);
		if (respuesta.ok) {
			const data = await respuesta.json();
			const listaJson = Object.values(data.productos || {}).map(p => ({
				etiqueta: 'Falabella',
				titulo: p.titulo,
				precio: `$${Number(p.precio || 0).toLocaleString('es-CL')}`,
				imagen: p.imagen,
				url: p.url
			}));
			catalogoUnificado = catalogoUnificado.concat(listaJson);
		}
	} catch (e) {
		console.warn('No se pudo leer productos.json en la búsqueda:', e);
	}

	// 2. Sumar productos de Supermercado (si existen en script.js)
	if (typeof PRODUCTOS_SUPERMERCADO !== 'undefined') {
		const listaSuper = PRODUCTOS_SUPERMERCADO.map(p => ({
			etiqueta: p.tienda,
			titulo: `${p.marca} - ${p.nombre}`,
			precio: p.precioOferta,
			imagen: p.imagen,
			url: p.url
		}));
		catalogoUnificado = catalogoUnificado.concat(listaSuper);
	}

	// 3. Filtrar por coincidencia en título o tienda
	const coincidencias = catalogoUnificado.filter(item =>
		normalizarTexto(item.titulo).includes(query) ||
		normalizarTexto(item.etiqueta).includes(query)
	);

	subtitulo.textContent = `Búsqueda: "${termino}" (${coincidencias.length} ${coincidencias.length === 1 ? 'resultado' : 'resultados'})`;

	// 4. Dibujar resultados o mensaje si no hubo coincidencias
	if (coincidencias.length === 0) {
		grid.innerHTML = `
			<div class="col-12 text-center py-4">
				<p class="text-white fs-5 mb-1">No encontramos productos que coincidan con <strong>"${termino}"</strong>.</p>
				<small class="text-light opacity-75">Intenta buscar otra palabra como "perfume", "boss", "leche" o "arroz".</small>
			</div>
		`;
	} else {
		grid.innerHTML = coincidencias.map(prod => `
			<div class="col-12 col-md-4">
				<div class="card h-100 border-0 rounded-4 shadow-sm overflow-hidden">
					<div class="position-relative bg-white p-3 text-center">
						<span class="badge bg-dark position-absolute top-0 start-0 m-3">${prod.etiqueta}</span>
						<img src="${prod.imagen}" alt="${prod.titulo}" class="img-fluid" style="height: 170px; object-fit: contain;">
					</div>
					<div class="card-body d-flex flex-column bg-white">
						<h5 class="card-title fw-bold text-dark fs-6 mt-1">${prod.titulo}</h5>
						<div class="mt-auto pt-3">
							<div class="fs-4 fw-bolder text-dark mb-2">${prod.precio}</div>
							<a href="${prod.url}" target="_blank" rel="noopener noreferrer" class="btn btn-warning w-100 fw-bold">
								Ver producto
							</a>
						</div>
					</div>
				</div>
			</div>
		`).join('');
	}

	if (typeof cerrarSupermercado === 'function') cerrarSupermercado();
	seccion.classList.remove('d-none');
	seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Conectar el formulario de la barra superior y cerrar búsqueda al cambiar de sección
document.addEventListener('DOMContentLoaded', () => {
	const formBuscador = document.querySelector('nav form, .navbar form');
	if (formBuscador) {
		formBuscador.addEventListener('submit', (e) => {
			e.preventDefault(); // Evita que la página se recargue
			const input = formBuscador.querySelector('input');
			if (input) buscarProductos(input.value);
		});
	}

	document.querySelectorAll('nav a, .navbar a').forEach(enlace => {
		enlace.addEventListener('click', () => {
			cerrarBusqueda();
		});
	});
});
//Enviar Formulario

function enviarFormularioContacto(event) {
	event.preventDefault();
	const alerta = document.getElementById('alerta-contacto');
	alerta.classList.remove('d-none');
	event.target.reset();

	setTimeout(() => {
		alerta.classList.add('d-none');
	}, 4000);
}
