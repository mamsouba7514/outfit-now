import './vision.worker.js';
import './composition.worker.js';

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
