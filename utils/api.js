const axios = require('axios');

const API_URL = 'https://wallet-sdk-api.everstake.one';
const ASSETS_API = 'https://dashboard-api.everstake.one';

const ERROR_TEXT = 'Please create or use correct token'

async function CheckToken(token) {
    try {
        const response = await axios.get(`${API_URL}/token/check/${token}`);
        const data = response.data;
        return data.result;
    } catch (error) {
        throw new Error(error);
    }
}

async function SetStats(token, action, amount, address, hash, chain) {
    try {
        await axios.post(
          `${API_URL}/stats/set`,
          {
              token: token,
              action: action,
              amount: +amount,
              address: address,
              chain: chain,
          },
          {
              headers: { 'Content-Type': 'application/json' },
          }
        );
    } catch (error) {
        throw new Error(error);
    }
}

async function CreateToken(name, type) {
    try {
        const response = await axios.post(
          `${API_URL}/token/create`,
          {
              name: name,
              type: type,
          },
          {
              headers: { 'Content-Type': 'application/json' },
          }
        );
        return response.data;
    } catch (error) {
        throw new Error(error);
    }
}

async function GetAssets(chain) {
    try {
        const response = await axios.get(`${ASSETS_API}/chain?name=${chain.toLowerCase()}`);
        return response.data;
    } catch (error) {
        throw new Error(error);
    }
}

module.exports = {
    CheckToken,
    SetStats,
    CreateToken,
    GetAssets,
    ERROR_TEXT,
};
