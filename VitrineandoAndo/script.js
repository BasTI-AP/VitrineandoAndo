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