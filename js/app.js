// =============================================================================
//  THE GLASS ELEMENT — app.js
//  
//  HOW YOUR CONTENT WORKS:
//  ────────────────────────
//  This site pulls all product listings and journal entries from a Google Sheet.
//  
//  To add a new product or journey:
//    1. Open your Google Sheet (link is in the SHEET_URL below)
//    2. Add a new row with the columns filled in
//    3. Refresh your website — done!
//
//  To set up your own Google Sheet:
//    1. Create a new Google Sheet
//    2. Row 1 should have these exact column headers:
//         category | brand | model | description | price | image | tag | date | link
//    3. Go to File → Share → Publish to web
//    4. Select "Entire Document" and format "CSV", then click Publish
//    5. Copy the URL and paste it into SHEET_CSV_URL below
//
//  Category values:  "eyewear", "camera", or "journey"
//  Image column:     Use any public image URL (e.g. from Instagram, Imgur, etc.)
//  Link column:      Optional URL — e.g. eBay listing, contact form, blog post
//
// =============================================================================

// ─── CONFIGURATION ───────────────────────────────────────────────────────────
// Replace this with your published Google Sheet CSV URL.
// Leave empty to use the built-in demo data in data/inventory.js
const SHEET_CSV_URL = '';
// ─────────────────────────────────────────────────────────────────────────────


document.addEventListener('DOMContentLoaded', async () => {
    let data;

    if (SHEET_CSV_URL) {
        data = await fetchFromGoogleSheet(SHEET_CSV_URL);
    }

    // Fallback to local demo data if no sheet is configured or fetch fails
    if (!data) {
        data = buildFromLocalData();
    }

    renderItems(data.eyewear, 'eyewear-grid');
    renderItems(data.cameras, 'camera-grid');
    renderItems(data.journeys, 'journey-grid', true);

    setupIntersectionObserver();
    setupSmoothScroll();
});


// ─── GOOGLE SHEETS FETCH ─────────────────────────────────────────────────────

async function fetchFromGoogleSheet(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Sheet fetch failed');
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (err) {
        console.warn('Could not load Google Sheet, falling back to local data:', err);
        return null;
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return null;

    // Parse header row
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const result = { eyewear: [], cameras: [], journeys: [] };

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row = {};
        headers.forEach((header, idx) => {
            row[header] = (values[idx] || '').trim();
        });

        const item = {
            brand: row.brand || '',
            model: row.model || '',
            title: row.model || row.brand || '',
            description: row.description || '',
            price: row.price || '',
            image: row.image || '',
            tag: row.tag || '',
            date: row.date || '',
            link: row.link || ''
        };

        const category = (row.category || '').toLowerCase();
        if (category === 'eyewear') {
            result.eyewear.push(item);
        } else if (category === 'camera') {
            result.cameras.push(item);
        } else if (category === 'journey') {
            result.journeys.push(item);
        }
    }

    return result;
}

// Handle quoted CSV fields (e.g. descriptions with commas)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}


// ─── LOCAL DATA FALLBACK ─────────────────────────────────────────────────────

function buildFromLocalData() {
    // Uses the inventoryData object from data/inventory.js
    if (typeof inventoryData !== 'undefined') {
        return inventoryData;
    }
    return { eyewear: [], cameras: [], journeys: [] };
}


// ─── RENDERING ───────────────────────────────────────────────────────────────

function renderItems(items, containerId, isJourney = false) {
    const container = document.getElementById(containerId);
    if (!container || !items || items.length === 0) return;

    items.forEach(item => {
        const card = document.createElement('article');
        card.className = 'glass-card';

        const titleText = isJourney
            ? (item.title || item.model || '')
            : `${item.brand} ${item.model}`.trim();

        // Build the link URL — defaults to email inquiry if none provided
        const defaultInquiry = `mailto:contact@theglasselement.com?subject=Inquiry: ${encodeURIComponent(titleText)}`;
        const linkUrl = item.link || defaultInquiry;
        const linkTarget = item.link ? ' target="_blank" rel="noopener"' : '';

        let footerHtml = '';
        if (isJourney) {
            footerHtml = `
                <div class="card-footer">
                    <span class="card-price">${item.date || ''}</span>
                    <a href="${linkUrl}"${linkTarget} class="btn">Read</a>
                </div>
            `;
        } else {
            footerHtml = `
                <div class="card-footer">
                    <span class="card-price">${item.price || ''}</span>
                    <a href="${linkUrl}"${linkTarget} class="btn">Inquire</a>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="card-image">
                <img src="${item.image}" alt="${titleText}" loading="lazy">
            </div>
            <div class="card-content">
                <span class="card-tag">${item.tag || ''}</span>
                <h3 class="card-title">${titleText}</h3>
                <p class="card-desc">${item.description || ''}</p>
                ${footerHtml}
            </div>
        `;

        container.appendChild(card);
    });
}


// ─── INTERSECTION OBSERVER ───────────────────────────────────────────────────

function setupIntersectionObserver() {
    const cards = document.querySelectorAll('.glass-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(card => observer.observe(card));
}


// ─── SMOOTH SCROLL ───────────────────────────────────────────────────────────

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80;
                const pos = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top: pos, behavior: 'smooth' });
            }
        });
    });
}
