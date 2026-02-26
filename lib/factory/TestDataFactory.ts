import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface representing the structure we expect our baseline test-data JSONs to have
 */
export interface ClientData {
    clientName: string;
    baseUrlOverrides?: Record<string, string>;
    authMetadata?: any;
    // Dynamic datasets for assertions depending on product
    evShopper?: any;
    evFleets?: any;
    [key: string]: any;
}

/**
 * A utility class replicating the data-driven execution methodology from the UI framework.
 */
export class TestDataFactory {
    private static readonly DATA_DIR = path.resolve(__dirname, '../../test-data');

    /**
     * Loads specific client dataset for parameterized test running.
     * Mirrors how UI loads `test-data/<client>/*.json`.
     */
    public static loadClientData(clientName: string, dataFile: string = 'baseline.json'): ClientData {
        const filePath = path.join(this.DATA_DIR, clientName, dataFile);

        if (!fs.existsSync(filePath)) {
            throw new Error(`Data file not found for client ${clientName} at ${filePath}`);
        }

        const rawData = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(rawData) as ClientData;
    }

    /**
     * Used to generate iterations based on an array of target clients.
     * Example: test.describe(..., () => { TestDataFactory.iterateClients(['isuzu_us', 'smud']).forEach(...) })
     */
    public static iterateClients(clients: string[]): { clientName: string, data: ClientData }[] {
        return clients.map(clientName => {
            try {
                // We attempt to load a generic 'api-baseline.json' or fallback to the UI's standard dataset names
                let data: ClientData;
                try {
                    data = this.loadClientData(clientName, 'api-baseline.json');
                } catch (e) {
                    data = this.loadClientData(clientName, 'data.json'); // Typical UI fallback
                }

                return { clientName, data };
            } catch (e) {
                console.warn(`[TestDataFactory] Unresolvable dataset for client: ${clientName}`);
                return { clientName, data: { clientName } };
            }
        });
    }
}
