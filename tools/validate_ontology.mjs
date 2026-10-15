import { readFile } from 'node:fs/promises';
import { validateOntology } from './ontology_validation.mjs';

const file = process.argv[2] || 'public/graph-assets/ontology.json';
const data = validateOntology(JSON.parse(await readFile(file, 'utf8')));
console.log(`Validated ${Object.keys(data.ontology.concepts).length} concepts, ${Object.keys(data.ontology.edges).length} relations, citations, and guided tours.`);
