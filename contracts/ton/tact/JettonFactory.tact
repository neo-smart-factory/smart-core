// █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
// █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
// NΞØ PROTOCOL | NΞØ SMART FACTORY
// Author: Eurycles Ramos Neto / NODE NEØ

import "@stdlib/ownable";
import "@stdlib/deploy";
import "./messages";
import "./JettonMinter";

contract NeoJettonFactory with Ownable, Deployable {
    owner: Address;
    treasury: Address;
    guardian: Address;
    paused: Bool = false;
    fee_bps: Int = 500; // 5% initial

    init(owner: Address, treasury: Address) {
        self.owner = owner;
        self.treasury = treasury;
        self.guardian = owner; // Initial guardian is owner
    }

    receive(msg: DeployJetton) {
        let ctx: Context = context();
        require(!self.paused, "Factory is paused");
        require(ctx.value >= ton("0.4"), "Insufficient TON for factory deploy");

        // Bounds Checking
        require(msg.max_supply > 0, "Invalid supply");
        require(msg.max_supply <= 1000000000000000000000000000, "Supply too high"); // 1B limit (normalized)
        
        // O Tact facilita o deploy de contratos filhos via initOf
        let init: StateInit = initOf NeoJettonMinter(
            msg.owner, 
            msg.content, 
            msg.max_supply, 
            msg.mint_price, 
            msg.mint_amount,
            self.treasury // Pass current treasury to new minter
        );
        let jettonAddress: Address = contractAddress(init);

        send(SendParameters{
            to: jettonAddress,
            value: ctx.value - ton("0.05"), // Reserva da Factory
            mode: SendPayGasSeparately,
            body: Deploy{queryId: 0}.toCell(),
            code: init.code,
            data: init.data
        });
    }

    // --- Security & Governance ---

    receive(msg: Pause) {
        require(sender() == self.owner || sender() == self.guardian, "Not authorized");
        self.paused = true;
    }

    receive(msg: Unpause) {
        require(sender() == self.owner, "Only owner can unpause");
        self.paused = false;
    }

    receive(msg: SetGuardian) {
        self.requireOwner();
        self.guardian = msg.address;
    }

    receive(msg: SetTreasury) {
        self.requireOwner();
        self.treasury = msg.address;
    }

    receive(msg: SetFee) {
        self.requireOwner();
        require(msg.bps <= 2000, "Fee too high"); // Max 20%
        self.fee_bps = msg.bps;
    }

    receive("withdraw") {
        self.requireOwner();
        send(SendParameters{
            to: self.owner,
            value: 0,
            mode: SendRemainingBalance
        });
    }

    get fun is_paused(): Bool { return self.paused; }
    get fun treasury(): Address { return self.treasury; }
    get fun fee(): Int { return self.fee_bps; }
}
