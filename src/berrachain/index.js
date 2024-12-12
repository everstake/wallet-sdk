"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Berrachain = void 0;
var utils_1 = require("../utils");
var web3_1 = require("web3");
var web3_2 = require("web3");
var bgt_1 = require("./bgt");
var constants_1 = require("./constants");
var errors_1 = require("./constants/errors");
var Berrachain = /** @class */ (function (_super) {
    __extends(Berrachain, _super);
    function Berrachain(network, rpc) {
        var _this = _super.call(this) || this;
        _this.ERROR_MESSAGES = errors_1.ERROR_MESSAGES;
        _this.ORIGINAL_ERROR_MESSAGES = errors_1.ORIGINAL_ERROR_MESSAGES;
        switch (network) {
            case 'testnet':
                _this.validator = constants_1.TESTNET_VALIDATOR;
                _this.btgAddress = constants_1.TESTNET_BGT_CONTRACT_ADDRESS;
                break;
            default:
                throw _this.throwError('NETWORK_ERROR');
        }
        var httpProvider = new web3_2.HttpProvider(rpc);
        _this.web3 = new web3_1.default(httpProvider);
        console.log(_this.web3);
        _this.btg = new _this.web3.eth.Contract(bgt_1.BGT_ABI, _this.btgAddress);
        return _this;
    }
    Berrachain.prototype.boost = function (address, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var amountWei, gasConsumption;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isAddress(address)) {
                            this.throwError('ADDRESS_FORMAT_ERROR');
                        }
                        amountWei = this.web3.utils.toWei(amount, 'ether');
                        return [4 /*yield*/, this.btg.methods
                                .queueBoost(this.validator, amount)
                                .estimateGas({ from: address })];
                    case 1:
                        gasConsumption = _a.sent();
                        return [2 /*return*/, {
                                from: address,
                                to: this.btgAddress,
                                value: Number(amountWei),
                                gasLimit: this.calculateGasLimit(gasConsumption),
                                data: this.btg.methods.queueBoost(address, amount).encodeABI(),
                            }];
                }
            });
        });
    };
    Berrachain.prototype.calculateGasLimit = function (gasConsumption) {
        return Number(gasConsumption) + constants_1.ETH_GAS_RESERVE;
    };
    Berrachain.prototype.isAddress = function (address) {
        return /^(0x)?([0-9a-f]{40})$/.test(address.toLowerCase());
    };
    return Berrachain;
}(utils_1.Blockchain));
exports.Berrachain = Berrachain;
