import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { parse, print } from 'graphql';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getAllGqlFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllGqlFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.gql') || entry.name.endsWith('.graphql'))) {
      files.push(fullPath);
    }
  }
  return files;
};

try {
  //console.log('Loading GraphQL files...');
  const gqlFiles = getAllGqlFiles(path.join(__dirname, 'schema'));

  //console.log(`Found ${gqlFiles.length} .gql files`);
  for (const filePath of gqlFiles) {
    const sdl = fs.readFileSync(filePath, 'utf8');
    try {
      parse(sdl);
    } catch (err) {
      console.error(`\n❌ Parse error in: ${filePath}`);
      console.error(err.message);
      if (err.locations) {
        console.error('Error locations:', JSON.stringify(err.locations, null, 2));
      }
      process.exit(1);
    }
  }
  const typesArray = loadFilesSync(path.join(__dirname, "schema"), {
    extensions: ["gql", "graphql"],
    recursive: true,
  });

  //console.log(`Loaded ${typesArray.length} GraphQL files`);
  
  // Save all loaded files to inspect
  //console.log('\n=== First 5 loaded files (first 30 lines each) ===');
  for (let i = 0; i < Math.min(5, typesArray.length); i++) {
    //console.log(`\n--- File ${i + 1} ---`);
    const lines = print(typesArray[i]).split('\n');
    for (let j = 0; j < Math.min(30, lines.length); j++) {
      //console.log(`${String(j + 1).padStart(3)}: ${lines[j]}`);
    }
  }
  
  //console.log('\nMerging type definitions...');
  const typeDefs = mergeTypeDefs(typesArray);
  
  //console.log('\nSchema merged successfully!');
  const mergedSchema = print(typeDefs);
  
  // Save merged schema to file for inspection
  fs.writeFileSync('merged_schema.gql', mergedSchema);
  //console.log('✅ Merged schema saved to merged_schema.gql');
  
  // Print lines around line 19
  const lines = mergedSchema.split('\n');
  //console.log('\n=== Lines 1-30 of merged schema ===');
  for (let i = 0; i < Math.min(30, lines.length); i++) {
    //console.log(`${String(i + 1).padStart(3)}: ${lines[i]}`);
  }
  
} catch (error) {
  console.error('❌ Error validating schema:', error.message);
  if (error.locations) {
    console.error('Error locations:', JSON.stringify(error.locations, null, 2));
  }
  console.error('\nFull error:');
  console.error(error);
  process.exit(1);
}
