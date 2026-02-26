# ZappyRide Playwright API Tests

This project contains Playwright API tests for the ZappyRide Vehicles API.

## Prerequisites

- Node.js (v14+)
- npm

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

## Running Tests

### Vehicles RTM API Tests (`tests/api/vehicles_rtm.spec.ts`)

This test file covers various scenarios for the `/vehicles` endpoint, including:
- Basic connectivity
- Parameter validation (postcode, tax_filing_type)
- Filtering (make, model_year)
- Pagination
- Error handling

To run these tests:
```bash
npx playwright test tests/api/vehicles_rtm.spec.ts
```

### Vehicle Specific Test (`tests/api/zappyride.vehicle_specific.spec.ts`)

This file contains specific test cases for vehicle retrieval.

To run this test:
```bash
npx playwright test tests/api/zappyride.vehicle_specific.spec.ts
```

### Run All Tests

To run all tests in the project:
```bash
npx playwright test
```

## Configuration

The `vehicles_rtm.spec.ts` file uses a hardcoded configuration for:
- Base URL: `https://api.d.zappyride.com`
- Access Token: `9e4b20b0031742bdda41ef9a9f2573dd`

Other tests may rely on `.env` files or other configurations in `src/config`.
