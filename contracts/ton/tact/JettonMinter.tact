// █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
// █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
// NΞØ PROTOCOL | NΞØ TOKEN MASTER
// Author: Eurycles Ramos Neto / NODE NEØ

import "@stdlib/ownable";
import "@stdlib/deploy";
import "./messages";
import "./constants";
import "./JettonWallet";

contract NeoJettonMinter with Ownable, Deployable {
    total_supply: Int as coins = 0;
    owner: Address;
    content: Cell;
    
    max_supply: Int as coins;
    mint_price: Int as coins;
    mint_amount: Int as coins;
    public_mint_enabled: Bool = true;
    bridge_minter: Address?;
    
    // Security & Governance
    paused: Bool = false;
    guardian: Address;
    treasury: Address;
    fee_bps: Int = 500; // 5% initial
    
    minters: map<Address, Bool>;

    init(owner: Address, content: Cell, max: Int, price: Int, amount: Int, treasury: Address) {
        self.owner = owner;
        self.content = content;
        self.max_supply = max;
        self.mint_price = price;
        self.mint_amount = amount;
        self.treasury = treasury;
        self.guardian = owner;
    }

    receive("public_mint") {
        let ctx: Context = context();
        require(!self.paused, "Contract is paused");
        require(self.public_mint_enabled, "Mint disabled");
        require(ctx.value >= self.mint_price + ton("0.05"), "Insufficient TON for fees");
        require(self.total_supply + self.mint_amount <= self.max_supply, "Max supply reached");
        require(self.minters.get(ctx.sender) == null, "Already minted");

        self.minters.set(ctx.sender, true);
        self.total_supply = self.total_supply + self.mint_amount;
        
        self.mintTokens(ctx.sender, self.mint_amount);
    }

    receive(msg: BurnNotification) {
        // Verifica se a mensagem veio de uma wallet válida
        let init: StateInit = initOf NeoJettonWallet(msg.sender, myAddress());
        require(sender() == contractAddress(init), "Invalid wallet");

        self.total_supply = self.total_supply - msg.amount;

        if (msg.response_destination != null) {
            send(SendParameters{
                to: msg.response_destination!!,
                value: 0,
                mode: SendRemainingValue,
                body: Excesses{query_id: msg.query_id}.toCell()
            });
        }
    }

    fun mintTokens(to: Address, amount: Int) {
        let init: StateInit = initOf NeoJettonWallet(to, myAddress());
        send(SendParameters{
            to: contractAddress(init),
            value: ton("0.03"), // Gas para deploy da wallet se necessário
            mode: SendPayGasSeparately,
            body: InternalTransfer{
                query_id: 0,
                amount: amount,
                from: myAddress(),
                response_address: to,
                forward_ton_amount: 0,
                forward_payload: emptySlice()
            }.toCell(),
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

    receive(msg: SetPublicMint) {
        self.requireOwner();
        self.public_mint_enabled = msg.enabled;
    }

    receive(msg: RequestWalletPause) {
        self.requireOwner(); 
        let init: StateInit = initOf NeoJettonWallet(msg.user, myAddress());
        send(SendParameters{
            to: contractAddress(init),
            value: ton("0.01"),
            mode: SendPayGasSeparately,
            body: SetWalletPause{paused: msg.paused}.toCell()
        });
    }

    receive(msg: SetBridgeMinter) {
        self.requireOwner();
        self.bridge_minter = msg.address;
    }

    receive(msg: BridgeMint) {
        let ctx: Context = context();
        require(!self.paused, "Contract is paused");
        require(ctx.sender == self.bridge_minter || ctx.sender == self.owner, "Not authorized for bridge mint");
        require(self.total_supply + msg.amount <= self.max_supply, "Max supply reached");

        self.total_supply = self.total_supply + msg.amount;
        self.mintTokens(msg.receiver, msg.amount);
    }

    receive("withdraw") {
        self.requireOwner();
        let balance: Int = myBalance();
        let withdrawAmount: Int = balance - MIN_RESERVE;
        
        if (withdrawAmount > 0) {
            let protocolPart: Int = (withdrawAmount * self.fee_bps) / 10000;
            send(SendParameters{to: self.treasury, value: protocolPart, mode: SendPayGasSeparately});
            send(SendParameters{to: self.owner, value: withdrawAmount - protocolPart, mode: SendPayGasSeparately});
        }
    }

    get fun get_jetton_data(): JettonData {
        return JettonData{
            total_supply: self.total_supply,
            mintable: true,
            admin_address: self.owner,
            content: self.content,
            wallet_code: (initOf NeoJettonWallet(self.owner, myAddress())).code
        };
    }

    get fun get_wallet_address(owner: Address): Address {
        return contractAddress(initOf NeoJettonWallet(owner, myAddress()));
    }

    get fun is_paused(): Bool { return self.paused; }
}

struct JettonData {
    total_supply: Int;
    mintable: Bool;
    admin_address: Address;
    content: Cell;
    wallet_code: Cell;
}
