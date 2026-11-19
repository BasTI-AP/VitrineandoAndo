const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());

app.get('/api/scrap', async (req, res) => {
	const { url } = req.query;
	if (!url) return res.status(400).json({ error: 'Falta la URL del producto' });

	let browser;
	try {
		browser = await puppeteer.launch({
			headless: 'new',
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		});

		const page = await browser.newPage();
		await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

		// Acelerar la carga bloqueando fuentes y multimedia innecesaria
		await page.setRequestInterception(true);
		page.on('request', (request) => {
			if (['font', 'media'].includes(request.resourceType())) {
				request.abort();
			} else {
				request.continue();
			}
		});

		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
		await page.waitForSelector('h1', { timeout: 10000 }).catch(() => {});

		const datos = await page.evaluate(() => {
			// 1. Buscar datos estructurados JSON-LD
			let prod = null;
			const scripts = document.querySelectorAll('script[type="application/ld+json"]');
			for (const s of scripts) {
				try {
					const json = JSON.parse(s.innerText);
					if (json['@type'] === 'Product') {
						prod = json;
						break;
					}
					if (Array.isArray(json['@graph'])) {
						const encontrado = json['@graph'].find(item => item['@type'] === 'Product');
						if (encontrado) {
							prod = encontrado;
							break;
						}
					}
				} catch (e) {}
			}

			if (prod) {
				const oferta = Array.isArray(prod.offers) ? prod.offers[0] : prod.offers;
				return {
					titulo: prod.name,
					precio: oferta?.price || oferta?.lowPrice || 0,
					imagen: Array.isArray(prod.image) ? prod.image[0] : prod.image,
					descripcion: prod.description || 'Sin descripción disponible.'
				};
			}

			// 2. Respaldo: leer etiquetas meta y DOM de Falabella
			const titulo = document.querySelector('h1')?.innerText?.trim()
				|| document.querySelector('meta[property="og:title"]')?.content
				|| 'Producto sin título';

			const precioTexto = document.querySelector('[data-internet-price]')?.getAttribute('data-internet-price')
				|| document.querySelector('[class*="prices-0"] span')?.innerText
				|| '0';
			const precioLimpio = Number(String(precioTexto).replace(/\D/g, '')) || 0;

			const imagen = document.querySelector('meta[property="og:image"]')?.content
				|| document.querySelector('img[src*="falabella"]')?.src
				|| '';

			const descripcion = document.querySelector('meta[property="og:description"]')?.content
				|| 'Sin descripción disponible.';

			return { titulo, precio: precioLimpio, imagen, descripcion };
		});

		await browser.close();

		if (!datos || !datos.titulo || datos.titulo.includes('Access Denied')) {
			return res.status(403).json({ error: 'Falabella bloqueó la petición.' });
		}

		res.json(datos);

	} catch (error) {
		if (browser) await browser.close();
		console.error('Error en scraping:', error);
		res.status(500).json({ error: error.message });
	}
});

app.listen(3000, () => {
	console.log('Servidor scraper con Puppeteer corriendo en http://localhost:3000');
});