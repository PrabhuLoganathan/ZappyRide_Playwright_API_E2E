import { APIRequestContext, APIResponse } from '@playwright/test';

export interface BaseApiOptions {
    baseURL?: string;
    defaultHeaders?: Record<string, string>;
}

export class BaseApi {
    protected request: APIRequestContext;
    protected baseURL?: string;
    protected defaultHeaders: Record<string, string>;

    constructor(request: APIRequestContext, options?: BaseApiOptions) {
        this.request = request;
        this.baseURL = options?.baseURL || process.env.API_BASE_URL;
        this.defaultHeaders = options?.defaultHeaders || {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // Add custom or auth headers here based on environment
            ...(process.env.API_AUTH_TOKEN && { 'Authorization': `Bearer ${process.env.API_AUTH_TOKEN}` })
        };
    }

    /**
     * Helper method to construct the full URL.
     */
    private buildUrl(endpoint: string): string {
        if (endpoint.startsWith('http')) {
            return endpoint;
        }
        const base = this.baseURL ? this.baseURL.replace(/\/$/, '') : '';
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${base}${path}`;
    }

    /**
     * Generic GET request handler with basic logging.
     */
    async get(endpoint: string, options?: Parameters<APIRequestContext['get']>[1]): Promise<APIResponse> {
        const url = this.buildUrl(endpoint);
        const mergedOptions = {
            ...options,
            headers: { ...this.defaultHeaders, ...options?.headers }
        };

        console.log(`[GET] Requesting: ${url}`);
        const response = await this.request.get(url, mergedOptions);
        console.log(`[GET] Response Status: ${response.status()} from ${url}`);

        return response;
    }

    /**
     * Generic POST request handler with basic logging.
     */
    async post(endpoint: string, options?: Parameters<APIRequestContext['post']>[1]): Promise<APIResponse> {
        const url = this.buildUrl(endpoint);
        const mergedOptions = {
            ...options,
            headers: { ...this.defaultHeaders, ...options?.headers }
        };

        console.log(`[POST] Requesting: ${url}`);
        const response = await this.request.post(url, mergedOptions);
        console.log(`[POST] Response Status: ${response.status()} from ${url}`);

        return response;
    }
}
