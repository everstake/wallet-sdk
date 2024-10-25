const Polygon = require('./polygon');
const Cosmos = require('./cosmos');
const Solana = require('./solana');
const Aptos = require('./aptos');
const Sui = require('./sui');
const Ethereum = require('./ethereum');
const Babylon = require('./babylon');
const { CreateToken, GetAssets } = require('./utils/api');

module.exports = {
    Polygon,
    Cosmos,
    Solana,
    Aptos,
    Sui,
    Ethereum,
    CreateToken,
    GetAssets,
    Babylon,
};

