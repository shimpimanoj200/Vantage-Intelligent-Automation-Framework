import dotenv from 'dotenv';

/**
 * Loads `.env` into process.env exactly once, before any module reads it.
 *
 * Import this for its side effect as the FIRST import of any module that reads
 * process.env at load time (Logger, ConfigManager). Existing variables (e.g. set
 * by cross-env in npm scripts) are not overridden.
 */
dotenv.config({ quiet: true });
