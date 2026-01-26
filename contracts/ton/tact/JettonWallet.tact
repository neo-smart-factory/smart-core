// █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
// █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
// NΞØ PROTOCOL | NΞØ TOKEN WALLET
// Author: Eurycles Ramos Neto / NODE NEØ

import "./messages";
import "./constants";

contract NeoJettonWallet {
    balance: Int as coins = 0;
    owner: Address;
    master: Address;
    paused: Bool = false;

    init(owner: Address, master: Address) {
        self.owner = owner;
        self.master = master;
    }

    // --- Minting & Transfers ---

    receive(msg: InternalTransfer) {
        let ctx: Context = context();
        // Apenas o Master ou outra Wallet válida podem enviar tokens
        // A verificação de wallet válida é feita via endereço (deterministic address)
        require(ctx.sender == self.master || sender() == self.master, "Invalid sender");
        
        self.balance = self.balance + msg.amount;

        if (msg.forward_ton_amount > 0) {
            send(SendParameters{
                to: self.owner,
                value: msg.forward_ton_amount,
                mode: SendPayGasSeparately,
                body: TransferNotification{
                    query_id: msg.query_id,
                    amount: msg.amount,
                    sender: msg.from,
                    forward_payload: msg.forward_payload
                }.toCell()
            });
        }
    }

    receive(msg: Transfer) {
        let ctx: Context = context();
        require(!self.paused, "Wallet is paused"); // Verificador de Pausa (Simetria EVM)
        require(ctx.sender == self.owner, "Invalid owner");
        require(self.balance >= msg.amount, "Insufficient balance");
        
        self.balance = self.balance - msg.amount;

        let init: StateInit = initOf NeoJettonWallet(msg.destination, self.master);
        let walletAddress: Address = contractAddress(init);

        send(SendParameters{
            to: walletAddress,
            value: 0,
            mode: SendRemainingValue,
            bounce: true, // Habilita o retorno se falhar
            body: InternalTransfer{
                query_id: msg.query_id,
                amount: msg.amount,
                from: self.owner,
                response_address: msg.response_destination,
                forward_ton_amount: msg.forward_ton_amount,
                forward_payload: msg.forward_payload
            }.toCell(),
            code: init.code,
            data: init.data
        });
    }

    // --- Error Handling (Bounced Messages) ---

    bounced(msg: Slice) {
        // Se a mensagem enviada falhou, devolvemos o saldo
        // O Tact passa o corpo da mensagem original que deu "bounce"
        msg.skipBits(32); // Skip op-code
        let op: Int = msg.loadUint(32);
        if (op == 0x05138d91) { // InternalTransfer
            let query_id: Int = msg.loadUint(64);
            let amount: Int = msg.loadCoins();
            self.balance = self.balance + amount;
        }
    }

    // --- Governance ---

    receive(msg: SetWalletPause) {
        require(sender() == self.master, "Only master can pause wallets");
        self.paused = msg.paused;
    }

    receive(msg: Burn) {
        let ctx: Context = context();
        require(!self.paused, "Wallet is paused");
        require(ctx.sender == self.owner, "Invalid owner");
        require(self.balance >= msg.amount, "Insufficient balance");

        self.balance = self.balance - msg.amount;

        send(SendParameters{
            to: self.master,
            value: 0,
            mode: SendRemainingValue,
            body: BurnNotification{
                query_id: msg.query_id,
                amount: msg.amount,
                sender: self.owner,
                response_destination: msg.response_destination
            }.toCell()
        });
    }

    // --- Audit Getters ---

    get fun balance(): Int { return self.balance; }
    get fun owner(): Address { return self.owner; }
    get fun master(): Address { return self.master; }
    get fun is_paused(): Bool { return self.paused; }
    
    get fun wallet_data(): WalletData {
        return WalletData{
            balance: self.balance,
            owner: self.owner,
            master: self.master,
            paused: self.paused
        };
    }
}

struct WalletData {
    balance: Int;
    owner: Address;
    master: Address;
    paused: Bool;
}
