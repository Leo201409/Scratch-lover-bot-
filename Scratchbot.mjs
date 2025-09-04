/**

Scratch Latest Project “Give It a ❤️” Site (Fixed)


---

Same as before, but I carefully fixed template literals, quotes,

and other potential syntax pitfalls so Node.js won’t complain. */


import express from 'express'; import fetch from 'node-fetch'; import helmet from 'helmet'; import morgan from 'morgan';

const app = express(); const PORT = process.env.PORT || 3000; const SCRATCH_USERNAME = process.env.SCRATCH_USERNAME || 'aishiksandipanial'; const USER_AGENT = 'Scratch-Latest-Project-Site/1.0 (+https://example.invalid)';

// Cache const cache = { latest: null, expires: 0 }; const wait = (ms) => new Promise((res) => setTimeout(res, ms));

async function fetchAllProjects(username, maxPages = 10) { const pageSize = 40; let offset = 0; let page = 0; const projects = [];

while (page < maxPages) { const url = https://api.scratch.mit.edu/users/${encodeURIComponent( username )}/projects?limit=${pageSize}&offset=${offset};

const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
if (!res.ok) throw new Error(`Scratch API error ${res.status}`);

const data = await res.json();
if (!Array.isArray(data) || data.length === 0) break;

projects.push(...data);

offset += pageSize;
page += 1;
await wait(150);

} return projects; }

function pickMostRecent(projects) { if (!projects || projects.length === 0) return null; const parseTs = (p) => { const h = p?.history || {}; return ( Date.parse(h.shared || '') || Date.parse(h.modified || '') || Date.parse(h.created || '') || 0 ); }; return projects.reduce((best, p) => (parseTs(p) > parseTs(best) ? p : best), projects[0]); }

async function fetchProjectStats(projectId) { const url = https://api.scratch.mit.edu/projects/${projectId}; const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } }); if (!res.ok) throw new Error(Scratch API error ${res.status}); const json = await res.json(); const s = json?.stats || {}; return { loves: s.loves ?? null, favorites: s.favorites ?? null, views: s.views ?? null, remixes: s.remixes ?? null, }; }

async function getLatestProject(username) { const now = Date.now(); if (cache.latest && cache.expires > now && cache.latest.username === username) { return cache.latest; }

const all = await fetchAllProjects(username); const latest = pickMostRecent(all); if (!latest) return null;

const id = latest.id; const title = latest.title || 'Untitled Project'; const shared = latest?.history?.shared || null;

const thumbnail = https://uploads.scratch.mit.edu/get_image/project/${id}_480x360.png;

let stats = {}; try { stats = await fetchProjectStats(id); } catch (e) { stats = {}; }

const payload = { username, id, title, shared, url: https://scratch.mit.edu/projects/${id}/, embedUrl: https://scratch.mit.edu/projects/${id}/embed, thumbnail, stats, };

cache.latest = payload; cache.expires = now + 60 * 1000; return payload; }

app.use( helmet({ contentSecurityPolicy: { useDefaults: true, directives: { 'img-src': ["'self'", 'data:', 'https://uploads.scratch.mit.edu', 'https://cdn2.scratch.mit.edu'], 'frame-src': ['https://scratch.mit.edu'], }, }, }) ); app.use(morgan('tiny'));

app.get('/api/latest', async (req, res) => { try { const username = (req.query.user || SCRATCH_USERNAME).toString(); const data = await getLatestProject(username); if (!data) return res.status(404).json({ error: 'No shared projects found.' }); res.json(data); } catch (e) { res.status(500).json({ error: e.message }); } });

app.get('/', async (req, res) => { try { const username = (req.query.user || SCRATCH_USERNAME).toString(); const data = await getLatestProject(username); if (!data) { res.status(404).send( htmlPage({ title: 'No projects yet', body: <p>We couldn\'t find any shared projects for <b>${escapeHtml(username)}</b>.</p>, }) ); return; }

const body = `
  <div class="container">
    <header class="head">
      <h1>Latest Scratch Project by <span>${escapeHtml(username)}</span></h1>
      <p class="muted">Shared: ${data.shared ? new Date(data.shared).toLocaleString() : 'N/A'}</p>
    </header>

    <section class="card">
      <div class="thumb">
        <a href="${data.url}" target="_blank" rel="noopener">
          <img src="${data.thumbnail}" alt="Project thumbnail" loading="lazy"/>
        </a>
      </div>
      <div class="meta">
        <h2>${escapeHtml(data.title)}</h2>
        <ul class="stats">
          <li>❤️ ${safeNum(data.stats.loves)}</li>
          <li>⭐ ${safeNum(data.stats.favorites)}</li>
          <li>👁️ ${safeNum(data.stats.views)}</li>
          <li>🧬 ${safeNum(data.stats.remixes)}</li>
        </ul>
        <div class="cta">
          <a class="btn primary" href="${data.url}" target="_blank" rel="noopener">Give it a ❤️ on Scratch</a>
          <a class="btn" href="${data.embedUrl}" target="_blank" rel="noopener">Open embed</a>
          <a class="btn ghost" href="/api/latest?user=${encodeURIComponent(username)}">API JSON</a>
        </div>
      </div>
    </section>

    <section class="embed">
      <iframe src="${data.embedUrl}" allowtransparency="true" width="640" height="520" frameborder="0" scrolling="no" allowfullscreen></iframe>
    </section>

    <footer class="foot">Built with ❤︎ for Scratchers. This site never auto-clicks or automates hearts.</footer>
  </div>
`;

res.status(200).send(
  htmlPage({ title: `${escapeHtml(data.title)} — by ${escapeHtml(username)}`, body })
);

} catch (e) { res.status(500).send(htmlPage({ title: 'Something went wrong', body: <pre>${escapeHtml(e.message)}</pre> })); } });

app.listen(PORT, () => { console.log(✓ Server listening on http://localhost:${PORT}); });

function safeNum(v) { return Number.isFinite(Number(v)) ? Number(v) : '—'; }

function htmlPage({ title, body }) { return `<!doctype html>

  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="See the latest Scratch project and give it a heart ❤️" />
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #0b1020; color: #eaf1ff; }
      .container { max-width: 900px; margin: auto; }
      .card { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; background: #121a33; border-radius: 20px; padding: 16px; }
      .thumb img { width: 100%; border-radius: 12px; }
      .stats { list-style: none; padding: 0; display: flex; gap: 12px; }
      .btn { padding: 10px 14px; border-radius: 12px; text-decoration: none; color: #fff; margin-right: 8px; }
      .btn.primary { background: linear-gradient(90deg, #7cc0ff, #b17cff); }
      .btn.ghost { border: 1px solid #7cc0ff; color: #9fb2d0; }
    </style>
  </head>
  <body>
    ${body}
  </body>
  </html>`;
}function escapeHtml(str = '') { return String(str) .replace(/&/g, '&') .replace(/</g, '<') .replace(/>/g, '>') .replace(/"/g, '"') .replace(/'/g, '''); }

