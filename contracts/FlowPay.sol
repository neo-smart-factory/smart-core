// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  NΞØ SMART FACTORY v0.5.3 - NΞØ PROTOCOL | TOKENIZE
 *  Author: NΞØ MELLØ
 *
 *  Licensed under MIT.
 *  "Powered by NΞØ SMART FACTORY"
 */

import "./NeoTokenV2.sol";

/**
 * @title FlowPay
 * @notice Token oficial do ecossistema FlowPay.
 * @dev Implementação baseada no NeoTokenV2 (Multichain & AA-Ready).
 */
contract FlowPay is NeoTokenV2 {
    constructor(
        address initialOwner
    )
        NeoTokenV2(
            "FlowPay",
            "FLOW",
            0.003 ether, // Preço padrão de mint para a Factory
            1000 * 10**18, // 1,000 tokens por mint público
            initialOwner
        )
    {}
}

/**
 *  █▀▀ █░░ █▀█ █░▄░█ █▀█ ▄▀█ █▄█
 *  █▀░ █▄▄ █▄█ ▀▄▀▄▀ █▀▀ █▀█ ░█
 *
 *  NΞØ SMART FACTORY v0.5.3 - NEØ PROTOCOL | FLOWPAY
 *  Author: NEØ MELLØ
 *
 *  Licensed under MIT. Attribution to NΞØ Protocol is required for derivatives.
 *  "Powered by NEO SMART FACTORY"
 */
