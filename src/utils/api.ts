import axios, { AxiosResponse } from 'axios';

const API_URL = 'https://wallet-sdk-api.everstake.one';
const ASSETS_API = 'https://dashboard-api.everstake.one';

const ERROR_TEXT = 'Please create or use correct token';

async function CheckToken(token: string): Promise<boolean> {
  const response: AxiosResponse = await axios.get(
    `${API_URL}/token/check/${token}`,
  );

  return response.data.result;
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
  await axios.post(
    `${API_URL}/stats/set`,
    {
      token,
      action,
      amount,
      address,
      chain,
    },
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

async function CreateToken(name: string, type: string) {
  const response: AxiosResponse = await axios.post(
    `${API_URL}/token/create`,
    {
      name,
      type,
    },
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  return response.data;
}

async function GetAssets(chain: string) {
  const response: AxiosResponse = await axios.get(
    `${ASSETS_API}/chain?name=${chain.toLowerCase()}`,
  );

  return response.data;
}

export { CheckToken, SetStats, CreateToken, GetAssets, ERROR_TEXT };
