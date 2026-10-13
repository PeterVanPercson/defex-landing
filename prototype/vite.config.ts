import {defineConfig} from 'vite';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
export default defineConfig(({command})=>({
  plugins:[{name:'defex-static-preview',configureServer(server){server.middlewares.use(async(req,res,next)=>{const path=req.url?.split('?')[0]??'';if(!path.startsWith('/static/')||path.includes('..'))return next();try{const file=resolve('..','.'+path);const bytes=await readFile(file);res.setHeader('Content-Type',path.endsWith('.woff2')?'font/woff2':path.endsWith('.svg')?'image/svg+xml':'application/octet-stream');res.end(bytes);}catch{next();}});}}],
  base:command==='build'?'/static/prototype/':'/',
  build:{chunkSizeWarningLimit:700},
}));
