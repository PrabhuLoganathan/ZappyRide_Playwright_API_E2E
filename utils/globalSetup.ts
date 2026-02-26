//globalSetup.js
import { FullConfig } from "@playwright/test";
import * as dotenv from 'dotenv';

async function globalSetup(config: FullConfig) {
    if (process.env.environment) {
        dotenv.config(
            {
                path: `profile/.env.${process.env.environment}`,
                override: true,
            });
    }
}

module.exports = globalSetup;