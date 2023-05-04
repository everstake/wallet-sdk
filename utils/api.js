const API_URL = 'https://wallet-sdk-api.everstake.one/';
const ASSETS_API = 'https://dashboard-api.everstake.one/';

const ERROR_TEXT = 'Please create or use correct token'

async function CheckToken(token) {
    try {
        const resp = await fetch(`${API_URL}/token/check/${token}`).then(response => response.json());
        return resp.result;
    } catch (error) {
        throw new Error(error);
    }
}

async function SetStats(token, action, amount, address, hash, chain) {
    await fetch(
        `${API_URL}/stats/set`,
        {
            method: 'post',
            body: JSON.stringify({
                token: token,
                action: action,
                amount: +amount,
                address: address,
                chain: chain
            }),
            headers: {'Content-Type': 'application/json'}
        }
    ).then(response => response.json());
}

async function CreateToken(name, type) {
    try {
        return await fetch(
            `${API_URL}/token/create`,
            {
                method: 'post',
                body: JSON.stringify({
                    name: name,
                    type: type,
                }),
                headers: {'Content-Type': 'application/json'}
            }
        ).then(response => response.json());
    } catch (error) {
        throw new Error(error);
    }
}

async function GetAssets(chain) {
    try {
        return await fetch(`${ASSETS_API}/chain?name=${chain.toLowerCase()}`).then(response => response.json());
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
