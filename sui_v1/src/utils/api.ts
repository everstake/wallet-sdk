/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { API_URL, ASSETS_API } from './constants';

async function CheckToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/token/check/${token}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.result;
  } catch (error) {
    console.error('Failed to check token:', error);
    throw error;
  }
}

interface SetStatsParams {
  token: string;
  action: string;
  amount: number;
  address: string;
  chain: string;
}

async function SetStats({
  token,
  action,
  amount,
  address,
  chain,
}: SetStatsParams): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/stats/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        action,
        amount,
        address,
        chain,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to set stats:', error);
    throw error;
  }
}

async function CreateToken(name: string, type: string) {
  try {
    const response = await fetch(`${API_URL}/token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Failed to create token:', error);
    throw error;
  }
}

async function GetAssets(chain: string) {
  try {
    const response = await fetch(
      `${ASSETS_API}/chain?name=${chain.toLowerCase()}`,
      {
        method: 'GET',
      },
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Failed to get assets:', error);
    throw error;
  }
}

export { CheckToken, SetStats, CreateToken, GetAssets };
