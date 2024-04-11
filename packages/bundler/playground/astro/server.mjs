import { existsSync, readFileSync } from 'fs';
import http from 'http';
import path from 'path';
import { handler as ssrHandler } from '../playground/dist/server/entry.mjs';

http.createServer((req, res) => {
	ssrHandler(req, res, err => {
		if (err) {
			res.writeHead(500);
			res.end(err.toString());
		} else {
			if (req.url.endsWith('.css')) {
				const filePath = path.join('dist', 'client', req.url.replace(/^\/+/, ''));
				if (existsSync(filePath)) {
					const content = readFileSync(filePath).toString();
					res.writeHead(200, {'Content-Type': 'text/css'});
					res.end(content, 'utf-8');
				}
				return;
			}

			res.writeHead(404);
			res.end();
		}
	});
}).listen(3000);
