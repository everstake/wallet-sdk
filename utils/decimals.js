const BigNumber = require('bignumber.js');

/** SetDecimal convert min unit amount to amount with decimals (example: 1e18 WEI -> 1 ETH)
 * @param {BigNumber} integerAmount - integer amount in min units
 * @param {number} decimals - decimals/precision (eth: 18, atom: 9 ...)
 * @returns {BigNumber} amount with decimals
 */
function SetDecimal(integerAmount, decimals) {
    const divider = new BigNumber(10).exponentiatedBy(new BigNumber(decimals));
    return integerAmount.dividedBy(divider);
}

/** UnsetDecimal convert token amount to min unit amount (example: 1 ETH -> 1e18 WEI)
 * @param {BigNumber} amount - token amount (could be with comma)
 * @param {number} decimals - decimals/precision (eth: 18, atom: 9 ...)
 * @returns {BigNumber} amount - (big) integer amount
 */
function UnsetDecimal(amount, decimals) {
    const multiplier = new BigNumber(10).exponentiatedBy(new BigNumber(decimals));
    return new BigNumber(amount.multipliedBy(multiplier).toFixed(0));
}

module.exports = {
    SetDecimal,
    UnsetDecimal,
};
