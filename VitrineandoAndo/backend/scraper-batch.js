const fs = require('fs');
const { chromium } = require('playwright');

// Lista de productos con hasta 5 tiendas por producto
const PRODUCTOS_A_COTIZAR = {
	'perfume-boss': {
		categoria: 'Perfumería',
		marca: 'Hugo Boss',
		tiendas: [
			{
				tienda: 'Falabella',
				url: 'https://www.falabella.com/falabella-cl/product/80013100/Perfume-Hombre-Boss-Bottled-Eau-De-Parfum-200-Ml/80013100'
			},
			{
				tienda: 'Paris',
				url: 'https://www.paris.cl/perfume-hombre-hugo-boss-bottled-edp-200-ml-80013100.html'
			},
			{
				tienda: 'Ripley',
				url: 'https://simple.ripley.cl/perfume-hugo-boss-bottled-edp-200-ml-2000381456789p'
			},
			{
				tienda: 'Mercado Libre',
				url: 'https://www.mercadolibre.cl/perfume-hugo-boss-bottled-edp-200ml/p/MLC18945612'
			},
			{
				tienda: 'La Polar',
				url: 'https://www.lapolar.cl/perfume-hombre-hugo-boss-bottled-edp-200-ml/24567890.html'
			}
		]
	}
};

const HUELLAS_NAVEGADOR = [
	{
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
		viewport: { width: 1366, height: 768 }
	},
	{
		userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
		viewport: { width: 1440, height: 900 }
	},
	{
		userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
		viewport: { width: 412, height: 915 }
	}
];

function esProductoValido(datos) {
	if (!datos || !datos.precio || datos.precio < 1000) return false;
	const tituloLower = (datos.titulo || '').toLowerCase();
	const bloqueos = ['un paso más', 'access denied', 'captcha', 'robot', 'cloudflare', '404', 'no encontrado'];
	return !bloqueos.some(palabra => tituloLower.includes(palabra));
}

function obtenerFechaChile() {
	const ahora = new Date();
	return ahora.toLocaleString('es-CL', {
		timeZone: 'America/Santiago',
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});
}

async function scrapearTienda(browser, itemTienda) {
	const huella = HUELLAS_NAVEGADOR[Math.floor(Math.random() * HUELLAS_NAVEGADOR.length)];
	const context = await browser.newContext({
		userAgent: huella.userAgent,
		viewport: huella.viewport,
		locale: 'es-CL'
	});
	const page = await context.newPage();

	try {
		await page.goto(itemTienda.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
		await page.waitForTimeout(3500 + Math.floor(Math.random() * 2000));

		const resultado = await page.evaluate(() => {
			let titulo = '';
			let precio = 0;
			let imagen = '';
			let descripcion = '';

			// 1. Intentar leer datos estructurados JSON-LD (funciona en Falabella, Paris, Ripley, MeLi, La Polar)
			const scriptsJson = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
			for (const sc of scriptsJson) {
				try {
					const raw = JSON.parse(sc.textContent);
					const items = Array.isArray(raw) ? raw : (raw['@graph'] ? raw['@graph'] : [raw]);
					const prod = items.find(i => i && (i['@type'] === 'Product' || (Array.isArray(i['@type']) && i['@type'].includes('Product'))));
					if (prod) {
						titulo = prod.name || titulo;
						descripcion = prod.description || descripcion;
						imagen = Array.isArray(prod.image) ? prod.image[0] : (prod.image?.url || prod.image || imagen);

						const offers = Array.isArray(prod.offers) ? prod.offers[0] : prod.offers;
						if (offers) {
							const pRaw = offers.lowPrice || offers.price || offers.highPrice;
							if (pRaw) precio = Number(String(pRaw).replace(/[^\d]/g, ''));
						}
					}
				} catch (_) {}
			}

			// 2. Respaldo con etiquetas Meta (OpenGraph / Product)
			if (!precio) {
				const metaPrecio = document.querySelector('meta[property="product:price:amount"], meta[property="og:price:amount"], meta[name="twitter:data1"]');
				if (metaPrecio) {
					precio = Number(String(metaPrecio.getAttribute('content')).replace(/[^\d]/g, ''));
				}
			}

			// 3. Respaldo con selectores visuales comunes
			if (!precio) {
				const selectoresPrecio = [
					'[data-internet-price]',
					'.prices-0 span',
					'.andes-money-amount__fraction',
					'.price-best',
					'.product-price'
				];
				for (const sel of selectoresPrecio) {
					const el = document.querySelector(sel);
					if (el) {
						const attr = el.getAttribute('data-internet-price') || el.textContent;
						const num = Number(String(attr).replace(/[^\d]/g, ''));
						if (num >= 1000) {
							precio = num;
							break;
						}
					}
				}
			}

			if (!titulo) {
				titulo = document.querySelector('h1')?.textContent?.trim() || document.title;
			}
			if (!imagen) {
				imagen = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
			}
			if (!descripcion) {
				descripcion = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
			}

			return { titulo, precio, imagen, descripcion };
		});

		await context.close();

		if (esProductoValido(resultado)) {
			return {
				tienda: itemTienda.tienda,
				url: itemTienda.url,
				precio: resultado.precio,
				titulo: resultado.titulo,
				imagen: resultado.imagen,
				descripcion: resultado.descripcion,
				exito: true
			};
		}
		return { tienda: itemTienda.tienda, url: itemTienda.url, exito: false };
	} catch (error) {
		console.warn(`⚠️ Error en ${itemTienda.tienda}:`, error.message);
		await context.close();
		return { tienda: itemTienda.tienda, url: itemTienda.url, exito: false };
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

	for (const [idProducto, config] of Object.entries(PRODUCTOS_A_COTIZAR)) {
		console.log(`\n🔍 Cotizando: ${idProducto}`);
		const previo = db.productos[idProducto] || {};
		const ofertasPrevias = Array.isArray(previo.ofertas) ? previo.ofertas : [];

		const ofertasActualizadas = [];
		let tituloDetectado = previo.titulo || idProducto;
		let imagenDetectada = previo.imagen || '';
		let descripcionDetectada = previo.descripcion || '';

		for (const tiendaCfg of config.tiendas) {
			const res = await scrapearTienda(browser, tiendaCfg);
			const anteriorTienda = ofertasPrevias.find(o => o.tienda === tiendaCfg.tienda);

			if (res.exito) {
				console.log(`   ✅ ${res.tienda}: $${res.precio.toLocaleString('es-CL')}`);
				ofertasActualizadas.push({
					tienda: res.tienda,
					precio: res.precio,
					url: res.url
				});
				if (res.titulo && res.titulo.length > 5) tituloDetectado = res.titulo;
				if (res.imagen) imagenDetectada = res.imagen;
				if (res.descripcion && res.descripcion.length > 15) descripcionDetectada = res.descripcion;
			} else if (anteriorTienda) {
				console.log(`   ⏳ ${tiendaCfg.tienda}: manteniendo último precio ($${anteriorTienda.precio.toLocaleString('es-CL')})`);
				ofertasActualizadas.push(anteriorTienda);
			}
		}

		if (ofertasActualizadas.length === 0) {
			console.log(`   ❌ No se obtuvieron precios válidos para ${idProducto}`);
			continue;
		}

		// Ordenar de menor a mayor precio para destacar la "MEJOR OPCIÓN" arriba
		ofertasActualizadas.sort((a, b) => a.precio - b.precio);
		const mejorOferta = ofertasActualizadas[0];

		// Registrar punto en el historial de precios por tienda
		const historial = Array.isArray(previo.historial) ? previo.historial : [];
		const snapshotPrecios = {};
		ofertasActualizadas.forEach(o => {
			snapshotPrecios[o.tienda] = o.precio;
		});

		historial.push({
			fecha: fechaActual,
			precios: snapshotPrecios
		});

		// Conservar los últimos 30 registros para que el gráfico sea legible
		const historialRecortado = historial.slice(-30);

		db.productos[idProducto] = {
			titulo: tituloDetectado,
			marca: config.marca || previo.marca || 'Destacado',
			categoria: config.categoria || previo.categoria || 'General',
			precio: mejorOferta.precio,
			tienda: mejorOferta.tienda,
			url: mejorOferta.url,
			imagen: imagenDetectada,
			descripcion: descripcionDetectada,
			ultimaActualizacion: fechaActual,
			ofertas: ofertasActualizadas,
			historial: historialRecortado
		};
	}

	await browser.close();
	fs.writeFileSync('productos.json', JSON.stringify(db, null, 2), 'utf8');
	console.log('\n💾 productos.json actualizado correctamente.');
}

ejecutar();
