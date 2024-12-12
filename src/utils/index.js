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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blockchain = exports.WalletSDKError = void 0;
var errors_1 = require("./constants/errors");
/**
 * `WalletSDKError` is a custom error class that extends the built-in `Error` class.
 * It provides additional properties for error handling within the Wallet SDK.
 *
 * @remarks
 * This class is needed to provide additional context for errors, such as a code
 * and the original error, if any.
 *
 * @public
 *
 * @param message - The error message.
 * @param code - A string representing the error code.
 * @param originalError - The original error that caused this error, if any.
 */
var WalletSDKError = /** @class */ (function (_super) {
    __extends(WalletSDKError, _super);
    function WalletSDKError(message, code, originalError) {
        var _newTarget = this.constructor;
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.originalError = originalError;
        // This line is needed to restore the correct prototype chain.
        Object.setPrototypeOf(_this, _newTarget.prototype);
        return _this;
    }
    return WalletSDKError;
}(Error));
exports.WalletSDKError = WalletSDKError;
/**
 * `Blockchain` is an abstract class that provides a structure for blockchain-specific classes.
 * It includes methods for error handling and throwing errors.
 *
 * @remarks
 * This class should be extended by classes that implement blockchain-specific functionality.
 * The extending classes should provide their own `ERROR_MESSAGES` and `ORIGINAL_ERROR_MESSAGES`.
 *
 * @property ERROR_MESSAGES - An object that maps error codes to error messages.
 * @property ORIGINAL_ERROR_MESSAGES - An object that maps original error messages to user-friendly error messages.
 *
 *
 * **/
var Blockchain = /** @class */ (function () {
    function Blockchain() {
    }
    /**
     * Handles errors that occur within the Ethereum class.
     *
     * @param {keyof typeof ERROR_MESSAGES} code - The error code associated with the error.
     * @param {Error | WalletSDKError | unknown} originalError - The original error that was thrown.
     *
     * If the original error is an instance of WalletSDKError, it is thrown as is.
     * If the original error is an instance of the built-in Error class, a new WalletSDKError is thrown with the original error as the cause.
     * If the original error is not an instance of WalletSDKError or Error, a new WalletSDKError is thrown with a generic message and code.
     */
    Blockchain.prototype.handleError = function (code, originalError) {
        var _a;
        var message = this.ERROR_MESSAGES[code];
        // If originalError is an instance of WalletSDKError, or if message or code is not defined,
        // throw the originalError
        if (originalError instanceof WalletSDKError || !message || !code) {
            throw originalError;
        }
        // If originalError is an instance of Error
        if (originalError instanceof Error) {
            // Find the first entry in ORIGINAL_ERROR_MESSAGES where the key is included in originalError.message
            // If such an entry is found, newMessage will be the value of that entry
            var newMessage = (_a = Object.entries(this.ORIGINAL_ERROR_MESSAGES).find(function (_a) {
                var originalMessage = _a[0];
                return originalError.message.includes(originalMessage);
            })) === null || _a === void 0 ? void 0 : _a[1];
            var errorMessage = newMessage ||
                this.ERROR_MESSAGES[code] ||
                errors_1.COMMON_ERROR_MESSAGES['UNKNOWN_ERROR'];
            throw new WalletSDKError(errorMessage, String(code), originalError);
        }
        throw new WalletSDKError(errors_1.COMMON_ERROR_MESSAGES['UNKNOWN_ERROR'], 'UNKNOWN_ERROR');
    };
    /**
     * Throws a WalletSDKError with a specified error code and message.
     *
     * @param {keyof typeof ERROR_MESSAGES} code - The error code associated with the error.
     * @param {...string[]} values - The values to be inserted into the error message.
     *
     * The method retrieves the error message template associated with the provided code from the ERROR_MESSAGES object.
     * It then replaces placeholders in the message template with provided values and throws a WalletSDKError with the final message and the provided code.
     */
    Blockchain.prototype.throwError = function (code) {
        var values = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            values[_i - 1] = arguments[_i];
        }
        var message = this.ERROR_MESSAGES[code];
        values.forEach(function (value, index) {
            message = message === null || message === void 0 ? void 0 : message.replace("{".concat(index, "}"), value);
        });
        if (!message) {
            throw new WalletSDKError(errors_1.COMMON_ERROR_MESSAGES['UNKNOWN_ERROR'], 'UNKNOWN_ERROR');
        }
        throw new WalletSDKError(message, String(code));
    };
    /**
     * Check if the URL is valid
     *
     * @param {string} url - URL
     * @returns a bool type result.
     *
     */
    Blockchain.prototype.isValidURL = function (url) {
        var urlClass;
        try {
            urlClass = new URL(url);
        }
        catch (_) {
            return false;
        }
        return urlClass.protocol === 'http:' || urlClass.protocol === 'https:';
    };
    return Blockchain;
}());
exports.Blockchain = Blockchain;
