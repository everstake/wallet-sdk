import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_URL = 'https://wallet-sdk-api.everstake.one';
const ASSETS_API = 'https://dashboard-api.everstake.one';

const ERROR_TEXT = 'Please create or use correct token';

const apiInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

const assetsInstance: AxiosInstance = axios.create({
  baseURL: ASSETS_API,
});

async function CheckToken(token: string): Promise<boolean> {
  const response: AxiosResponse = await apiInstance.get(
    `/token/check/${token}`,
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
  await apiInstance.post('/stats/set', {
    token,
    action,
    amount,
    address,
    chain,
  });
}

async function CreateToken(name: string, type: string) {
  const response: AxiosResponse = await apiInstance.post('/token/create', {
    name,
    type,
  });

  return response.data;
}

async function GetAssets(chain: string) {
  const response: AxiosResponse = await assetsInstance.get(
    `/chain?name=${chain.toLowerCase()}`,
  );

  return response.data;
}

export { CheckToken, SetStats, CreateToken, GetAssets, ERROR_TEXT };
