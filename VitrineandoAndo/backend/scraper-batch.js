const fs = require('fs');
const { chromium } = require('playwright');

// 5 TIENDAS QUE EL BOT RASTREA AUTOMÁTICAMENTE POR PALABRA CLAVE
const TIENDAS_BUSQUEDA = [
	{
		tienda: 'Falabella',
		construirUrl: (q) => `https://www.falabella.com/falabella-cl/search?Ntt=${encodeURIComponent(q)}`
	},
	{
		tienda: 'Paris',
		construirUrl: (q) => `https://www.paris.cl/search?q=${encodeURIComponent(q)}`
	},
	{
		tienda: 'Ripley',
		construirUrl: (q) => `https://simple.ripley.cl/search/${encodeURIComponent(q)}`
	},
	{
		tienda: 'Mercado Libre',
		construirUrl: (q) => `https://listado.mercadolibre.cl/${encodeURIComponent(q.trim().replace(/\s+/g, '-'))}`
	},
	{
		tienda: 'La Polar',
		construirUrl: (q) => `https://www.lapolar.cl/search?q=${encodeURIComponent(q)}`
	}
];

// LOS 24 PRODUCTOS DE LAS 8 CATEGORÍAS (3 POR CATEGORÍA)
const CATALOGO_BOT = [
	// 1. Ropa & Calzado
	{ id: 'zapatillas-nike-air-max', categoria: 'Ropa & Calzado', marca: 'Nike', condicion: 'Nuevo', destacado: true, query: 'zapatillas nike air max hombre' },
	{ id: 'poleron-adidas-essentials', categoria: 'Ropa & Calzado', marca: 'Adidas', condicion: 'Nuevo', destacado: false, query: 'poleron adidas hombre' },
	{ id: 'jeans-levis-501', categoria: 'Ropa & Calzado', marca: "Levi's", condicion: 'Nuevo', destacado: false, query: 'jeans levis 501 hombre' },

	// 2. Supermercado
	{ id: 'pack-aceite-vegetal', categoria: 'Supermercado', marca: 'Chef', condicion: 'Nuevo', destacado: true, query: 'aceite maravilla chef 1 litro' },
	{ id: 'leche-colun-entera', categoria: 'Supermercado', marca: 'Colun', condicion: 'Nuevo', destacado: false, query: 'leche entera colun 1 litro' },
	{ id: 'arroz-miraflores-1kg', categoria: 'Supermercado', marca: 'Miraflores', condicion: 'Nuevo', destacado: false, query: 'arroz miraflores 1 kg' },

	// 3. Hogar & Muebles
	{ id: 'sofa-seccional-3-cuerpos', categoria: 'Hogar & Muebles', marca: 'Basement Home', condicion: 'Nuevo', destacado: true, query: 'sofa seccional 3 cuerpos' },
	{ id: 'juego-comedor-4-sillas', categoria: 'Hogar & Muebles', marca: 'Form', condicion: 'Nuevo', destacado: false, query: 'juego comedor 4 sillas' },
	{ id: 'juego-sabanas-cannon', categoria: 'Hogar & Muebles', marca: 'Cannon', condicion: 'Nuevo', destacado: false, query: 'juego sabanas 2 plazas cannon' },

	// 4. Herramientas
	{ id: 'taladro-inalambrico-18v', categoria: 'Herramientas', marca: 'Bosch', condicion: 'Nuevo', destacado: true, query: 'taladro inalambrico 18v bosch' },
	{ id: 'esmeril-angular-makita', categoria: 'Herramientas', marca: 'Makita', condicion: 'Nuevo', destacado: false, query: 'esmeril angular makita' },
	{ id: 'set-herramientas-stanley', categoria: 'Herramientas', marca: 'Stanley', condicion: 'Nuevo', destacado: false, query: 'set herramientas stanley' },

	// 5. Vehículos
	{ id: 'neumatico-bridgestone-205', categoria: 'Vehículos', marca: 'Bridgestone', condicion: 'Nuevo', destacado: false, query: 'neumatico bridgestone 205 55 r16' },
	{ id: 'aceite-motor-castrol', categoria: 'Vehículos', marca: 'Castrol', condicion: 'Nuevo', destacado: false, query: 'aceite motor castrol 5w30 4l' },
	{ id: 'compresor-aire-michelin', categoria: 'Vehículos', marca: 'Michelin', condicion: 'Nuevo', destacado: false, query: 'compresor aire auto michelin' },

	// 6. Farmacia
	{ id: 'perfume-boss', categoria: 'Farmacia', marca: 'Hugo Boss', condicion: 'Nuevo', destacado: false, query: 'perfume boss bottled 200 ml' },
	{ id: 'protector-solar-laroche', categoria: 'Farmacia', marca: 'La Roche-Posay', condicion: 'Nuevo', destacado: false, query: 'protector solar la roche posay' },
	{ id: 'crema-hidratante-cerave', categoria: 'Farmacia', marca: 'CeraVe', condicion: 'Nuevo', destacado: false, query: 'locion hidratante cerave 473ml' },

	// 7. Servicios
	{ id: 'plan-movil-5g-200gb', categoria: 'Servicios', marca: 'Telecomunicaciones', condicion: 'Nuevo', destacado: false, query: 'chip plan prepago movistar entel' },
	{ id: 'pasaje-santiago-puertomontt', categoria: 'Servicios', marca: 'Vuelos Nacionales', condicion: 'Nuevo', destacado: false, query: 'maleta cabina viaje avion' },
	{ id: 'entrada-festival-musica', categoria: 'Servicios', marca: 'Eventos', condicion: 'Nuevo', destacado: false, query: 'audifonos concierto festival' },

	// 8. Usados
	{ id: 'bicicleta-paseo-aro-26', categoria: 'Usados', marca: 'Oxford', condicion: 'Usado', destacado: false, query: 'bicicleta paseo aro 26 usada' },
	{ id: 'iphone-13-128gb-usado', categoria: 'Usados', marca: 'Apple', condicion: 'Usado', destacado: false, query: 'iphone 13 128gb reacondicionado' },
	{ id: 'consola-ps4-slim-usada', categoria: 'Usados', marca: 'Sony', condicion: 'Usado', destacado: false, query: 'consola ps4 slim usada' }
];

const HUELLAS_NAVEGADOR = [
	{
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
		viewport: { width: 1366, height: 768 }
	},
	{
		userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
		viewport: { width: 1440, height: 900 }
	}
];

function obtenerFechaChile() {
	return new Date().toLocaleString('es-CL', {
		timeZone: 'America/Santiago',
		day: '2-digit',
		month: '2-digit'
	});
}

function guardarBaseDatos(db) {
	fs.writeFileSync('productos.json', JSON.stringify(db, null, 2), 'utf8');
}

async function crearPaginaOptimizada(browser) {
	const huella = HUELLAS_NAVEGADOR[Math.floor(Math.random() * HUELLAS_NAVEGADOR.length)];
	const context = await browser.newContext({
		userAgent: huella.userAgent,
		viewport: huella.viewport,
		locale: 'es-CL'
	});
	const page = await context.newPage();

	await page.route('**/*', (route) => {
		const tipo = route.request().resourceType();
		if (tipo === 'font' || tipo === 'media') {
			route.abort();
		} else {
			route.continue();
		}
	});

	return { context, page };
}

async function buscarEnTienda(browser, tiendaObj, query) {
	const { context, page } = await crearPaginaOptimizada(browser);
	const urlBusqueda = tiendaObj.construirUrl(query);

	try {
		await page.goto(urlBusqueda, { waitUntil: 'domcontentloaded', timeout: 30000 });
		await page.waitForTimeout(2200 + Math.floor(Math.random() * 1200));

		const item = await page.evaluate(() => {
			const selectoresTarjeta = [
				'[data-pod]',
				'.pod',
				'.poly-card',
				'.ui-search-layout__item',
				'[data-testid="product-card"]',
				'.product-tile',
				'.catalog-product-item'
			];

			let tarjetas = [];
			for (const sel of selectoresTarjeta) {
				const encontradas = Array.from(document.querySelectorAll(sel));
				if (encontradas.length > 0) {
					tarjetas = encontradas;
					break;
				}
			}

			for (const card of tarjetas.slice(0, 4)) {
				const linkEl = card.querySelector('a[href]');
				const imgEl = card.querySelector('img');
				const tituloEl = card.querySelector('b, .pod-subTitle, .poly-component__title, .ui-search-item__title, .product-name, h2, h3');

				const textoCard = card.innerText || '';
				const coincidenciasPrecio = textoCard.match(/\$\s?[\d.]{3,}/g) || [];
				const numeros = coincidenciasPrecio
					.map(p => Number(p.replace(/[^\d]/g, '')))
					.filter(n => n >= 500 && n <= 20000000);

				const titulo = tituloEl?.textContent?.trim() || linkEl?.getAttribute('title') || '';
				const url = linkEl?.href || '';
				const imagen = imgEl?.getAttribute('data-src') || imgEl?.src || '';

				if (titulo.length > 4 && numeros.length > 0 && url.startsWith('http')) {
					const precio = Math.min(...numeros);
					const precioNormal = numeros.length > 1 ? Math.max(...numeros) : 0;
					return {
						titulo,
						precio,
						precioNormal: precioNormal > precio ? precioNormal : 0,
						imagen,
						url
					};
				}
			}
			return null;
		});

		await context.close();

		if (item && item.precio >= 500) {
			return {
				tienda: tiendaObj.tienda,
				precio: item.precio,
				precioNormal: item.precioNormal,
				titulo: item.titulo,
				imagen: item.imagen,
				url: item.url,
				exito: true
			};
		}
		return { tienda: tiendaObj.tienda, exito: false };
	} catch (error) {
		await context.close();
		return { tienda: tiendaObj.tienda, exito: false };
	}
}

async function ejecutar() {
	let db = { productos: {} };
	if (fs.existsSync('productos.json')) {
		try {
			db = JSON.parse(fs.readFileSync('productos.json', 'utf8'));
			if (!db.productos) db.productos = {};
		} catch (_) {}
	}

	const browser = await chromium.launch({ headless: true });
	const fechaActual = obtenerFechaChile();

	for (const itemCfg of CATALOGO_BOT) {
		console.log(`\n🔎 [${itemCfg.categoria}] Actualizando: ${itemCfg.id}`);
		const previo = db.productos[itemCfg.id] || {};
		const mapaOfertas = new Map();

		// Conserva las ofertas precargadas como respaldo
		if (Array.isArray(previo.ofertas)) {
			previo.ofertas.forEach(o => mapaOfertas.set(o.tienda, o));
		}

		let precioNormalBase = previo.precioNormal || 0;

		for (const tiendaObj of TIENDAS_BUSQUEDA) {
			const res = await buscarEnTienda(browser, tiendaObj, itemCfg.query);
			if (res.exito) {
				console.log(`   ✅ ${res.tienda}: $${res.precio.toLocaleString('es-CL')}`);
				mapaOfertas.set(res.tienda, {
					tienda: res.tienda,
					precio: res.precio,
					url: res.url
				});
				if (res.precioNormal > res.precio && res.precioNormal > precioNormalBase) {
					precioNormalBase = res.precioNormal;
				}
			} else {
				console.log(`   ⏳ ${tiendaObj.tienda}: manteniendo último valor guardado`);
			}
		}

		const ofertasFinales = Array.from(mapaOfertas.values())
			.sort((a, b) => a.precio - b.precio)
			.slice(0, 5);

		if (ofertasFinales.length === 0) continue;

		const mejor = ofertasFinales[0];
		const historial = Array.isArray(previo.historial) ? previo.historial : [];
		const snapshot = {};
		ofertasFinales.forEach(o => { snapshot[o.tienda] = o.precio; });

		// Evita duplicar punto en el gráfico si ya se registró hoy
		if (historial.length > 0 && historial[historial.length - 1].fecha === fechaActual) {
			historial[historial.length - 1].precios = snapshot;
		} else {
			historial.push({ fecha: fechaActual, precios: snapshot });
		}

		db.productos[itemCfg.id] = {
			titulo: previo.titulo || itemCfg.query,
			marca: itemCfg.marca,
			categoria: itemCfg.categoria,
			condicion: itemCfg.condicion,
			destacado: itemCfg.destacado,
			precioNormal: precioNormalBase > mejor.precio ? precioNormalBase : Math.round(mejor.precio * 1.18),
			precio: mejor.precio,
			tienda: mejor.tienda,
			imagen: previo.imagen || '',
			descripcion: previo.descripcion || `Comparativa en ${ofertasFinales.length} tiendas para ${itemCfg.query}.`,
			ultimaActualizacion: fechaActual,
			ofertas: ofertasFinales,
			historial: historial.slice(-15)
		};

		guardarBaseDatos(db);
	}

	await browser.close();
	guardarBaseDatos(db);
	console.log('\n💾 productos.json actualizado por el bot correctamente.');
}

ejecutar();
