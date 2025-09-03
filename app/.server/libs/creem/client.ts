import { env } from "cloudflare:workers";
import type { Checkout } from "./types";

import type {
  FetcherOptions,
  FetcherError,
  CreateCallbackSignatureParams,
  CreateCheckoutsPayload,
  CreateCheckoutsResponse,
} from "./type";

/**
 * Creem API Client - A class to handle API interactions with the Creem service
 */
export class CreemApiClient {
  private baseUrl: string;
  private apiKey: string;
  private webhookSecret: string;

  constructor(baseUrl?: string, apiKey?: string, webhookSecret?: string) {
    this.baseUrl = baseUrl || "https://api.creem.io";
    this.apiKey = apiKey || env.CREEM_KEY || "";
    this.webhookSecret = webhookSecret || env.CREEM_WEBHOOK_SECRET || "";
  }

  /**
   * Generic fetch method to make API requests
   */
  private async fetcher<T = any>(
    path: string,
    data?: any,
    method: "GET" | "POST" = "GET",
    options: FetcherOptions = {}
  ): Promise<T> {
    let url = new URL(path, this.baseUrl).toString();

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey,
      ...options.headers,
    };

    const config: RequestInit = {
      method,
      headers,
      ...options,
    };

    if (data) {
      if (method.toUpperCase() === "GET") {
        const params = new URLSearchParams(data).toString();
        url += `?${params}`;
      } else {
        config.body = JSON.stringify(data);
      }
    }

    try {
      const response = await fetch(url, config);
      const responseData = await response.json<T>();

      if (!response.ok) {
        const error = new Error("API request failed") as FetcherError;
        error.status = response.status;
        error.data = responseData;
        throw error;
      }

      return responseData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Creates a checkout session
   * @param payload Checkout creation parameters
   * @returns Checkout response with URL and details
   */
  async createCheckout(
    payload: CreateCheckoutsPayload
  ): Promise<CreateCheckoutsResponse> {
    const response = await this.fetcher<CreateCheckoutsResponse>(
      "/v1/checkouts",
      payload,
      "POST"
    );
    return response;
  }

  /**
   * Gets information about an existing checkout
   * @param checkoutId The ID of the checkout to retrieve
   * @returns Checkout details
   */
  async getCheckout(checkoutId: string): Promise<Checkout> {
    const response = await this.fetcher<Checkout>(
      "/v1/checkouts",
      { checkout_id: checkoutId },
      "GET"
    );
    return response;
  }

  /**
   * Creates a callback signature for verifying webhook authenticity
   * @param params Parameters to include in the signature
   * @returns Signature hash
   */
  async createCallbackSignature(params: CreateCallbackSignatureParams): Promise<string> {
    const data = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${value}`)
      .concat(`salt=${this.apiKey}`)
      .join("|");

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Creates a webhook signature for verifying webhook payloads
   * @param payload Raw webhook payload as string
   * @returns Signature hash
   */
  async createWebhookSignature(payload: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.webhookSecret);
    const payloadData = encoder.encode(payload);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, payloadData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verifies a webhook signature against the payload
   * @param signature The signature from the webhook header
   * @param payload The raw webhook payload
   * @returns Boolean indicating if the signature is valid
   */
  async verifyWebhookSignature(signature: string, payload: string): Promise<boolean> {
    const computedSignature = await this.createWebhookSignature(payload);
    
    // Use a constant-time comparison
    if (signature.length !== computedSignature.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ computedSignature.charCodeAt(i);
    }
    
    return result === 0;
  }
}
