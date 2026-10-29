const fs=require('fs');const path=require('path');const esbuild=require('esbuild');
const files=[];function visit(dir){for(const d of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,d.name);if(d.isDirectory())visit(p);else if(/\.tsx?$/.test(p))files.push(p)}}visit('src');
esbuild.build({entryPoints:files,bundle:true,packages:'external',outdir:'audit/zip-module-check',write:false,logLevel:'warning'}).then(r=>console.log('Compiled',files.length,'TypeScript source modules')).catch(()=>process.exitCode=1);
