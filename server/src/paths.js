import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '../..');
export const DATA_DIR = path.resolve(__dirname, 'data');
export const CLIENT_DIST = path.resolve(ROOT_DIR, 'client/dist');
