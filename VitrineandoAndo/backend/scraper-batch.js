const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Lista de productos que quieres mantener actualizados
const PRODUCTOS_A_COTIZAR = {
	'perfume-boss': {
		url: 'https://www.falabella.com/falabella-cl/product/80013100/Perfume-Hombre-Boss-Bottled-Eau-De-Parfum-200-Ml/80013100'
	}
	// Si quieres agregar más productos después, solo añádelos aquí con coma:
	// 'otro-producto': { url: 'https://www.falabella.com/...' }
};

/* ============= Validación: no borrar precios buenos cuando lo bloquean ============== */

function esProductoValido(datos) {
	if (!datos || !datos.titulo) return false;

	const tituloLimpio = datos.titulo.toLowerCase().trim();
	const bloqueos = ['un paso más', 'producto sin título', 'access denied', 'captcha', 'robot', 'just a moment', 'error'];
	if (bloqueos.some(palabra => tituloLimpio.includes(palabra))) {
		return false;
	}

	const numeroPrecio = Number(datos.precio || 0);
	if (!numeroPrecio || numeroPrecio <= 0) {
		return false;
	}

	return true;
}

const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const PERFILES = [
	{
		ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
		viewport: { width: 1366, height: 768 }
	},
	{
		ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
		viewport: { width: 1440, height: 900 }
	},
	{
		ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
		viewport: { width: 1920, height: 1080 }
	}
];

/* ==================================================================================== */

async function ejecutarScraping() {
	console.log('Iniciando actualización de precios...');
	const rutaArchivo = path.join(__dirname, '..', 'productos.json');

	// 1. Cargar respaldo anterior para no perder datos válidos si Falabella bloquea
	let resultados = {};
	if (fs.existsSync(rutaArchivo)) {
		try {
			const archivoAnterior = JSON.parse(fs.readFileSync(rutaArchivo, 'utf-8'));
			resultados = archivoAnterior.productos || {};
		} catch (e) {
			resultados = {};
		}
	}

	const browser = await puppeteer.launch({
		headless: 'new',
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-dev-shm-usage',
			'--disable-blink-features=AutomationControlled'
		]
	});

	for (const [id, info] of Object.entries(PRODUCTOS_A_COTIZAR)) {
		console.log(`Extrayendo: ${id}...`);
		let actualizado = false;

		// 2. Hasta 3 intentos rotando navegador y resolución si detecta bloqueo
		for (let intento = 1; intento <= 3; intento++) {
			const perfil = PERFILES[(intento - 1) % PERFILES.length];
			const page = await browser.newPage();

			try {
				await page.setUserAgent(perfil.ua);
				await page.setViewport(perfil.viewport);
				await page.setExtraHTTPHeaders({ 'Accept-Language': 'es-CL,es;q=0.9' });
				await page.evaluateOnNewDocument(() => {
					Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
				});

				await page.goto(info.url, { waitUntil: 'domcontentloaded', timeout: 35000 });
				await page.waitForSelector('script[type="application/ld+json"], h1', { timeout: 8000 }).catch(() => {});
				await esperar(2000 + Math.floor(Math.random() * 2000));

				const datos = await page.evaluate(() => {
					let prod = null;
					const scripts = document.querySelectorAll('script[type="application/ld+json"]');
					for (const s of scripts) {
						try {
							const json = JSON.parse(s.innerText);
							if (json['@type'] === 'Product') { prod = json; break; }
							if (Array.isArray(json['@graph'])) {
								const encontrado = json['@graph'].find(item => item['@type'] === 'Product');
								if (encontrado) { prod = encontrado; break; }
							}
						} catch (e) {}
					}

					if (prod) {
						const oferta = Array.isArray(prod.offers) ? prod.offers[0] : prod.offers;
						return {
							titulo: prod.name,
							precio: Number(oferta?.price || oferta?.lowPrice || 0),
							imagen: Array.isArray(prod.image) ? prod.image[0] : prod.image,
							descripcion: prod.description || 'Sin descripción disponible.'
						};
					}

					const titulo = document.querySelector('h1')?.innerText?.trim() || 'Producto sin título';
					const precioTexto = document.querySelector('[data-internet-price]')?.getAttribute('data-internet-price')
						|| document.querySelector('[class*="prices-0"] span')?.innerText || '0';
					const precio = Number(String(precioTexto).replace(/\D/g, '')) || 0;
					const imagen = document.querySelector('meta[property="og:image"]')?.content || '';
					const descripcion = document.querySelector('meta[property="og:description"]')?.content || 'Sin descripción disponible.';

					return { titulo, precio, imagen, descripcion };
				});

				// 3. Validar antes de guardar
				if (esProductoValido(datos)) {
					resultados[id] = {
						...datos,
						url: info.url
					};
					console.log(`OK (intento ${intento}) -> ${datos.titulo} ($${datos.precio})`);
					actualizado = true;
					break;
				} else {
					console.warn(`Intento ${intento} bloqueado ("${datos.titulo}", $${datos.precio}). Cambiando perfil...`);
				}

			} catch (error) {
				console.error(`Error en intento ${intento} con ${id}:`, error.message);
			} finally {
				await page.close();
			}

			await esperar(3000 * intento);
		}

		if (!actualizado) {
			console.warn(`No se pudo actualizar ${id}. Se conserva el último dato válido guardado.`);
		}
	}

	await browser.close();

	// Guardar el archivo productos.json en la carpeta principal (un nivel arriba)
	const salida = {
		ultimaActualizacion: new Date().toISOString(),
		productos: resultados
	};

	fs.writeFileSync(rutaArchivo, JSON.stringify(salida, null, 2), 'utf-8');
	console.log('Archivo productos.json generado correctamente.');
}

ejecutarScraping();
