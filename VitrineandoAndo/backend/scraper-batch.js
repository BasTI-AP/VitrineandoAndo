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

async function ejecutarScraping() {
	console.log('Iniciando actualización de precios...');
	const browser = await puppeteer.launch({
		headless: 'new',
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
	});

	const resultados = {};

	for (const [id, info] of Object.entries(PRODUCTOS_A_COTIZAR)) {
		console.log(`Extrayendo: ${id}...`);
		const page = await browser.newPage();

		try {
			await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

			await page.setRequestInterception(true);
			page.on('request', (req) => {
				if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
					req.abort();
				} else {
					req.continue();
				}
			});

			await page.goto(info.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
			await page.waitForSelector('script[type="application/ld+json"], h1', { timeout: 6000 }).catch(() => {});

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

			resultados[id] = {
				...datos,
				url: info.url
			};
			console.log(`OK -> ${datos.titulo} ($${datos.precio})`);

		} catch (error) {
			console.error(`Error con ${id}:`, error.message);
		} finally {
			await page.close();
		}
	}

	await browser.close();

	// Guardar el archivo productos.json en la carpeta principal (un nivel arriba)
	const salida = {
		ultimaActualizacion: new Date().toISOString(),
		productos: resultados
	};

	const rutaArchivo = path.join(__dirname, '..', 'productos.json');
	fs.writeFileSync(rutaArchivo, JSON.stringify(salida, null, 2), 'utf-8');
	console.log('Archivo productos.json generado correctamente.');
}

ejecutarScraping();