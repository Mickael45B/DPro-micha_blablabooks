#!/usr/bin/env node
// generate_resolver_docs.js
// Génère un fichier Markdown résumant les Query/Mutation/Subscription et l'emplacement des resolvers

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { buildASTSchema } from 'graphql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main(){
  const schemaDir = path.join(__dirname, '..', 'schema');
  const resolversDir = path.join(__dirname, '..', 'resolvers');
  const outDir = path.join(__dirname, '..', 'docs');
  await fs.mkdir(outDir, { recursive: true });

  // Load and merge schema files
  const typesArray = loadFilesSync(schemaDir, { extensions: ['gql','graphql'], recursive: true });
  const merged = mergeTypeDefs(typesArray);
  const schema = buildASTSchema(merged);

  // Dynamically import aggregated resolvers (index.js)
  let aggregatedResolvers = {};
  try{
    const idx = pathToFileURL(path.join(resolversDir, 'index.js')).href;
    const mod = await import(idx);
    aggregatedResolvers = mod.default || mod;
  } catch(err){
    console.error('Could not import resolvers index:', err.message);
    // continue: we will still produce schema-based docs
  }

  // Import each resolver module individually to map fields to files
  const resolverFiles = (await fs.readdir(resolversDir)).filter(f => f.endsWith('.js') && f !== 'index.js');
  const resolverMap = { Query: {}, Mutation: {}, Subscription: {} }; // fieldName -> filename

  for(const file of resolverFiles){
    const full = path.join(resolversDir, file);
    try{
      const url = pathToFileURL(full).href;
      const mod = await import(url);
      const obj = mod.default || mod;
      ['Query','Mutation','Subscription'].forEach(root => {
        if(obj && obj[root] && typeof obj[root] === 'object'){
          for(const field of Object.keys(obj[root])){
            resolverMap[root][field] = file;
          }
        }
      });
    } catch(err){
      // ignore failing imports (e.g., TS files or others)
    }
  }

  function typeToStr(type){
    try{ return String(type); } catch(e){ return 'Unknown'; }
  }

  let md = '# GraphQL Resolvers Documentation\n\n';
  md += 'Generated from schema files in `backend/schema` and resolver modules in `backend/resolvers`.\n\n';

  const roots = [ ['Query', schema.getQueryType()], ['Mutation', schema.getMutationType()], ['Subscription', schema.getSubscriptionType()] ];

  for(const [rootName, rootType] of roots){
    if(!rootType) continue;
    md += `## ${rootName}\n\n`;
    const fields = rootType.getFields();
    for(const fname of Object.keys(fields)){
      const f = fields[fname];
      md += `### ${fname}\n\n`;
      if(f.description) md += `${f.description}\n\n`;
      if(f.args && f.args.length){
        md += '**Arguments**\n\n';
        for(const a of f.args){
          md += '- `' + a.name + '` : ' + typeToStr(a.type) + '\n';
        }
        md += '\n';
      }
      md += `**Return type**: ${typeToStr(f.type)}\n\n`;
  const impl = (resolverMap[rootName] && resolverMap[rootName][fname]) || '— (no custom resolver found)';
  md += '**Resolver implementation**: `' + impl + '`\n\n';
    }
  }

  const outPath = path.join(outDir, 'resolvers.md');
  await fs.writeFile(outPath, md, 'utf8');
  console.log('Resolver documentation generated at', outPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
