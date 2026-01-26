// █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
// █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
// NΞØ PROTOCOL | CONSTANTS

const PROTOCOL_FEE_BPS: Int = 500; // 5%
const MIN_RESERVE: Int = ton("0.05");
const PROTOCOL_TREASURY: Address = address("UQBqdVqFqwdMY985u7Qjl97Hoai0N2XZzNhNkVOE8LBhm0i0");

// Error Codes
const ERROR_INSUFFICIENT_FUNDS: Int = 1000;
const ERROR_NOT_OWNER: Int = 1001;
const ERROR_MAX_SUPPLY_REACHED: Int = 1002;
const ERROR_MINT_DISABLED: Int = 1003;
const ERROR_ALREADY_MINTED: Int = 1004;
