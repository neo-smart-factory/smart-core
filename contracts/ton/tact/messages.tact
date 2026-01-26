// █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
// █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
// NΞØ PROTOCOL | NODE NEURAL INTERFACES

message(0x75097f5d) Transfer {
    query_id: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address?;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining;
}

message(0x05138d91) InternalTransfer {
    query_id: Int as uint64;
    amount: Int as coins;
    from: Address;
    response_address: Address?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining;
}

message(0x7362d09c) TransferNotification {
    query_id: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forward_payload: Slice as remaining;
}

message(0x595f07bc) Burn {
    query_id: Int as uint64;
    amount: Int as coins;
    response_destination: Address?;
    custom_payload: Cell?;
}

message(0x7bdd97de) BurnNotification {
    query_id: Int as uint64;
    amount: Int as coins;
    sender: Address;
    response_destination: Address?;
}

message(0xd53276db) Excesses {
    query_id: Int as uint64;
}

// NΞØ V2 Specific
message(0x61caf729) DeployJetton {
    owner: Address;
    content: Cell;
    max_supply: Int as coins;
    mint_price: Int as coins;
    mint_amount: Int as coins;
}

message(0x12345678) SetPublicMint {
    enabled: Bool;
}

message(0x87654321) SetBridgeMinter {
    address: Address;
}

message(0x75111111) BridgeMint {
    receiver: Address;
    amount: Int as coins;
}

message(0x11111111) SetWalletPause {
    paused: Bool;
}

message(0x22222222) RequestWalletPause {
    user: Address;
    paused: Bool;
}

// Security & Governance
message(0x10000001) Pause {}
message(0x10000002) Unpause {}
message(0x10000003) SetGuardian {
    address: Address;
}
message(0x10000004) SetTreasury {
    address: Address;
}
message(0x10000005) SetFee {
    bps: Int;
}
