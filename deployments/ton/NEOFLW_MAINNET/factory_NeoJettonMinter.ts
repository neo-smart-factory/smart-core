import {
    Cell,
    Slice,
    Address,
    Builder,
    beginCell,
    ComputeError,
    TupleItem,
    TupleReader,
    Dictionary,
    contractAddress,
    address,
    ContractProvider,
    Sender,
    Contract,
    ContractABI,
    ABIType,
    ABIGetter,
    ABIReceiver,
    TupleBuilder,
    DictionaryValue
} from '@ton/core';

export type DataSize = {
    $$type: 'DataSize';
    cells: bigint;
    bits: bigint;
    refs: bigint;
}

export function storeDataSize(src: DataSize) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.cells, 257);
        b_0.storeInt(src.bits, 257);
        b_0.storeInt(src.refs, 257);
    };
}

export function loadDataSize(slice: Slice) {
    const sc_0 = slice;
    const _cells = sc_0.loadIntBig(257);
    const _bits = sc_0.loadIntBig(257);
    const _refs = sc_0.loadIntBig(257);
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadGetterTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function storeTupleDataSize(source: DataSize) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.cells);
    builder.writeNumber(source.bits);
    builder.writeNumber(source.refs);
    return builder.build();
}

export function dictValueParserDataSize(): DictionaryValue<DataSize> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDataSize(src)).endCell());
        },
        parse: (src) => {
            return loadDataSize(src.loadRef().beginParse());
        }
    }
}

export type SignedBundle = {
    $$type: 'SignedBundle';
    signature: Buffer;
    signedData: Slice;
}

export function storeSignedBundle(src: SignedBundle) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBuffer(src.signature);
        b_0.storeBuilder(src.signedData.asBuilder());
    };
}

export function loadSignedBundle(slice: Slice) {
    const sc_0 = slice;
    const _signature = sc_0.loadBuffer(64);
    const _signedData = sc_0;
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadGetterTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function storeTupleSignedBundle(source: SignedBundle) {
    const builder = new TupleBuilder();
    builder.writeBuffer(source.signature);
    builder.writeSlice(source.signedData.asCell());
    return builder.build();
}

export function dictValueParserSignedBundle(): DictionaryValue<SignedBundle> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSignedBundle(src)).endCell());
        },
        parse: (src) => {
            return loadSignedBundle(src.loadRef().beginParse());
        }
    }
}

export type StateInit = {
    $$type: 'StateInit';
    code: Cell;
    data: Cell;
}

export function storeStateInit(src: StateInit) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeRef(src.code);
        b_0.storeRef(src.data);
    };
}

export function loadStateInit(slice: Slice) {
    const sc_0 = slice;
    const _code = sc_0.loadRef();
    const _data = sc_0.loadRef();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadGetterTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function storeTupleStateInit(source: StateInit) {
    const builder = new TupleBuilder();
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    return builder.build();
}

export function dictValueParserStateInit(): DictionaryValue<StateInit> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStateInit(src)).endCell());
        },
        parse: (src) => {
            return loadStateInit(src.loadRef().beginParse());
        }
    }
}

export type Context = {
    $$type: 'Context';
    bounceable: boolean;
    sender: Address;
    value: bigint;
    raw: Slice;
}

export function storeContext(src: Context) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBit(src.bounceable);
        b_0.storeAddress(src.sender);
        b_0.storeInt(src.value, 257);
        b_0.storeRef(src.raw.asCell());
    };
}

export function loadContext(slice: Slice) {
    const sc_0 = slice;
    const _bounceable = sc_0.loadBit();
    const _sender = sc_0.loadAddress();
    const _value = sc_0.loadIntBig(257);
    const _raw = sc_0.loadRef().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadGetterTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function storeTupleContext(source: Context) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.bounceable);
    builder.writeAddress(source.sender);
    builder.writeNumber(source.value);
    builder.writeSlice(source.raw.asCell());
    return builder.build();
}

export function dictValueParserContext(): DictionaryValue<Context> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeContext(src)).endCell());
        },
        parse: (src) => {
            return loadContext(src.loadRef().beginParse());
        }
    }
}

export type SendParameters = {
    $$type: 'SendParameters';
    mode: bigint;
    body: Cell | null;
    code: Cell | null;
    data: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeSendParameters(src: SendParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        if (src.code !== null && src.code !== undefined) { b_0.storeBit(true).storeRef(src.code); } else { b_0.storeBit(false); }
        if (src.data !== null && src.data !== undefined) { b_0.storeBit(true).storeRef(src.data); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadSendParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _code = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _data = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleSendParameters(source: SendParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserSendParameters(): DictionaryValue<SendParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSendParameters(src)).endCell());
        },
        parse: (src) => {
            return loadSendParameters(src.loadRef().beginParse());
        }
    }
}

export type MessageParameters = {
    $$type: 'MessageParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeMessageParameters(src: MessageParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadMessageParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleMessageParameters(source: MessageParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserMessageParameters(): DictionaryValue<MessageParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMessageParameters(src)).endCell());
        },
        parse: (src) => {
            return loadMessageParameters(src.loadRef().beginParse());
        }
    }
}

export type DeployParameters = {
    $$type: 'DeployParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    bounce: boolean;
    init: StateInit;
}

export function storeDeployParameters(src: DeployParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeBit(src.bounce);
        b_0.store(storeStateInit(src.init));
    };
}

export function loadDeployParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _bounce = sc_0.loadBit();
    const _init = loadStateInit(sc_0);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadGetterTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadGetterTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function storeTupleDeployParameters(source: DeployParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeBoolean(source.bounce);
    builder.writeTuple(storeTupleStateInit(source.init));
    return builder.build();
}

export function dictValueParserDeployParameters(): DictionaryValue<DeployParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployParameters(src)).endCell());
        },
        parse: (src) => {
            return loadDeployParameters(src.loadRef().beginParse());
        }
    }
}

export type StdAddress = {
    $$type: 'StdAddress';
    workchain: bigint;
    address: bigint;
}

export function storeStdAddress(src: StdAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 8);
        b_0.storeUint(src.address, 256);
    };
}

export function loadStdAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(8);
    const _address = sc_0.loadUintBig(256);
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleStdAddress(source: StdAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeNumber(source.address);
    return builder.build();
}

export function dictValueParserStdAddress(): DictionaryValue<StdAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStdAddress(src)).endCell());
        },
        parse: (src) => {
            return loadStdAddress(src.loadRef().beginParse());
        }
    }
}

export type VarAddress = {
    $$type: 'VarAddress';
    workchain: bigint;
    address: Slice;
}

export function storeVarAddress(src: VarAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 32);
        b_0.storeRef(src.address.asCell());
    };
}

export function loadVarAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(32);
    const _address = sc_0.loadRef().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleVarAddress(source: VarAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeSlice(source.address.asCell());
    return builder.build();
}

export function dictValueParserVarAddress(): DictionaryValue<VarAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeVarAddress(src)).endCell());
        },
        parse: (src) => {
            return loadVarAddress(src.loadRef().beginParse());
        }
    }
}

export type BasechainAddress = {
    $$type: 'BasechainAddress';
    hash: bigint | null;
}

export function storeBasechainAddress(src: BasechainAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        if (src.hash !== null && src.hash !== undefined) { b_0.storeBit(true).storeInt(src.hash, 257); } else { b_0.storeBit(false); }
    };
}

export function loadBasechainAddress(slice: Slice) {
    const sc_0 = slice;
    const _hash = sc_0.loadBit() ? sc_0.loadIntBig(257) : null;
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadGetterTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function storeTupleBasechainAddress(source: BasechainAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.hash);
    return builder.build();
}

export function dictValueParserBasechainAddress(): DictionaryValue<BasechainAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBasechainAddress(src)).endCell());
        },
        parse: (src) => {
            return loadBasechainAddress(src.loadRef().beginParse());
        }
    }
}

export type ChangeOwner = {
    $$type: 'ChangeOwner';
    queryId: bigint;
    newOwner: Address;
}

export function storeChangeOwner(src: ChangeOwner) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2174598809, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.newOwner);
    };
}

export function loadChangeOwner(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2174598809) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _newOwner = sc_0.loadAddress();
    return { $$type: 'ChangeOwner' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadTupleChangeOwner(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwner' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadGetterTupleChangeOwner(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwner' as const, queryId: _queryId, newOwner: _newOwner };
}

export function storeTupleChangeOwner(source: ChangeOwner) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.newOwner);
    return builder.build();
}

export function dictValueParserChangeOwner(): DictionaryValue<ChangeOwner> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeChangeOwner(src)).endCell());
        },
        parse: (src) => {
            return loadChangeOwner(src.loadRef().beginParse());
        }
    }
}

export type ChangeOwnerOk = {
    $$type: 'ChangeOwnerOk';
    queryId: bigint;
    newOwner: Address;
}

export function storeChangeOwnerOk(src: ChangeOwnerOk) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(846932810, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.newOwner);
    };
}

export function loadChangeOwnerOk(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 846932810) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _newOwner = sc_0.loadAddress();
    return { $$type: 'ChangeOwnerOk' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadTupleChangeOwnerOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwnerOk' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadGetterTupleChangeOwnerOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwnerOk' as const, queryId: _queryId, newOwner: _newOwner };
}

export function storeTupleChangeOwnerOk(source: ChangeOwnerOk) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.newOwner);
    return builder.build();
}

export function dictValueParserChangeOwnerOk(): DictionaryValue<ChangeOwnerOk> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeChangeOwnerOk(src)).endCell());
        },
        parse: (src) => {
            return loadChangeOwnerOk(src.loadRef().beginParse());
        }
    }
}

export type Deploy = {
    $$type: 'Deploy';
    queryId: bigint;
}

export function storeDeploy(src: Deploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2490013878, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2490013878) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadGetterTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function storeTupleDeploy(source: Deploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeploy(): DictionaryValue<Deploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadDeploy(src.loadRef().beginParse());
        }
    }
}

export type DeployOk = {
    $$type: 'DeployOk';
    queryId: bigint;
}

export function storeDeployOk(src: DeployOk) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2952335191, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeployOk(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2952335191) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadGetterTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function storeTupleDeployOk(source: DeployOk) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeployOk(): DictionaryValue<DeployOk> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployOk(src)).endCell());
        },
        parse: (src) => {
            return loadDeployOk(src.loadRef().beginParse());
        }
    }
}

export type FactoryDeploy = {
    $$type: 'FactoryDeploy';
    queryId: bigint;
    cashback: Address;
}

export function storeFactoryDeploy(src: FactoryDeploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1829761339, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.cashback);
    };
}

export function loadFactoryDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1829761339) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _cashback = sc_0.loadAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadGetterTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function storeTupleFactoryDeploy(source: FactoryDeploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.cashback);
    return builder.build();
}

export function dictValueParserFactoryDeploy(): DictionaryValue<FactoryDeploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeFactoryDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadFactoryDeploy(src.loadRef().beginParse());
        }
    }
}

export type Transfer = {
    $$type: 'Transfer';
    query_id: bigint;
    amount: bigint;
    destination: Address;
    response_destination: Address | null;
    custom_payload: Cell | null;
    forward_ton_amount: bigint;
    forward_payload: Slice;
}

export function storeTransfer(src: Transfer) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1963556701, 32);
        b_0.storeUint(src.query_id, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.destination);
        b_0.storeAddress(src.response_destination);
        if (src.custom_payload !== null && src.custom_payload !== undefined) { b_0.storeBit(true).storeRef(src.custom_payload); } else { b_0.storeBit(false); }
        b_0.storeCoins(src.forward_ton_amount);
        b_0.storeBuilder(src.forward_payload.asBuilder());
    };
}

export function loadTransfer(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1963556701) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _destination = sc_0.loadAddress();
    const _response_destination = sc_0.loadMaybeAddress();
    const _custom_payload = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _forward_ton_amount = sc_0.loadCoins();
    const _forward_payload = sc_0;
    return { $$type: 'Transfer' as const, query_id: _query_id, amount: _amount, destination: _destination, response_destination: _response_destination, custom_payload: _custom_payload, forward_ton_amount: _forward_ton_amount, forward_payload: _forward_payload };
}

export function loadTupleTransfer(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _destination = source.readAddress();
    const _response_destination = source.readAddressOpt();
    const _custom_payload = source.readCellOpt();
    const _forward_ton_amount = source.readBigNumber();
    const _forward_payload = source.readCell().asSlice();
    return { $$type: 'Transfer' as const, query_id: _query_id, amount: _amount, destination: _destination, response_destination: _response_destination, custom_payload: _custom_payload, forward_ton_amount: _forward_ton_amount, forward_payload: _forward_payload };
}

export function loadGetterTupleTransfer(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _destination = source.readAddress();
    const _response_destination = source.readAddressOpt();
    const _custom_payload = source.readCellOpt();
    const _forward_ton_amount = source.readBigNumber();
    const _forward_payload = source.readCell().asSlice();
    return { $$type: 'Transfer' as const, query_id: _query_id, amount: _amount, destination: _destination, response_destination: _response_destination, custom_payload: _custom_payload, forward_ton_amount: _forward_ton_amount, forward_payload: _forward_payload };
}

export function storeTupleTransfer(source: Transfer) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.destination);
    builder.writeAddress(source.response_destination);
    builder.writeCell(source.custom_payload);
    builder.writeNumber(source.forward_ton_amount);
    builder.writeSlice(source.forward_payload.asCell());
    return builder.build();
}

export function dictValueParserTransfer(): DictionaryValue<Transfer> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTransfer(src)).endCell());
        },
        parse: (src) => {
            return loadTransfer(src.loadRef().beginParse());
        }
    }
}

export type InternalTransfer = {
    $$type: 'InternalTransfer';
    query_id: bigint;
    amount: bigint;
    from: Address;
    response_address: Address | null;
    forward_ton_amount: bigint;
    forward_payload: Slice;
}

export function storeInternalTransfer(src: InternalTransfer) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(85167505, 32);
        b_0.storeUint(src.query_id, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.from);
        b_0.storeAddress(src.response_address);
        b_0.storeCoins(src.forward_ton_amount);
        b_0.storeBuilder(src.forward_payload.asBuilder());
    };
}

export function loadInternalTransfer(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 85167505) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _from = sc_0.loadAddress();
    const _response_address = sc_0.loadMaybeAddress();
    const _forward_ton_amount = sc_0.loadCoins();
    const _forward_payload = sc_0;
    return { $$type: 'InternalTransfer' as const, query_id: _query_id, amount: _amount, from: _from, response_address: _response_address, forward_ton_amount: _forward_ton_amount, forward_payload: _forward_payload };
}

export function loadTupleInternalTransfer(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _from = source.readAddress();
    const _response_address = source.readAddressOpt();
    const _forward_ton_amount = source.readBigNumber();
    const _forward_payload = source.readCell().asSlice();
    return { $$type: 'InternalTransfer' as const, query_id: _query_id, amount: _amount, from: _from, response_address: _response_address, forward_ton_amount: _forward_ton_amount, forward_payload: _forward_payload };
}

export function loadGetterTupleInternalTransfer(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _from = source.readAddress();
    const _response_address = source.readAddressOpt();
    const _forward_ton_amount = source.readBigNumber();
    const _forward_payload = source.readCell().asSlice();
    return { $$type: 'InternalTransfer' as const, query_id: _query_id, amount: _amount, from: _from, response_address: _response_address, forward_ton_amount: _forward_ton_amount, forward_payload: _forward_payload };
}

export function storeTupleInternalTransfer(source: InternalTransfer) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.from);
    builder.writeAddress(source.response_address);
    builder.writeNumber(source.forward_ton_amount);
    builder.writeSlice(source.forward_payload.asCell());
    return builder.build();
}

export function dictValueParserInternalTransfer(): DictionaryValue<InternalTransfer> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeInternalTransfer(src)).endCell());
        },
        parse: (src) => {
            return loadInternalTransfer(src.loadRef().beginParse());
        }
    }
}

export type TransferNotification = {
    $$type: 'TransferNotification';
    query_id: bigint;
    amount: bigint;
    sender: Address;
    forward_payload: Slice;
}

export function storeTransferNotification(src: TransferNotification) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1935855772, 32);
        b_0.storeUint(src.query_id, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.sender);
        b_0.storeBuilder(src.forward_payload.asBuilder());
    };
}

export function loadTransferNotification(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1935855772) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _sender = sc_0.loadAddress();
    const _forward_payload = sc_0;
    return { $$type: 'TransferNotification' as const, query_id: _query_id, amount: _amount, sender: _sender, forward_payload: _forward_payload };
}

export function loadTupleTransferNotification(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _forward_payload = source.readCell().asSlice();
    return { $$type: 'TransferNotification' as const, query_id: _query_id, amount: _amount, sender: _sender, forward_payload: _forward_payload };
}

export function loadGetterTupleTransferNotification(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _forward_payload = source.readCell().asSlice();
    return { $$type: 'TransferNotification' as const, query_id: _query_id, amount: _amount, sender: _sender, forward_payload: _forward_payload };
}

export function storeTupleTransferNotification(source: TransferNotification) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.sender);
    builder.writeSlice(source.forward_payload.asCell());
    return builder.build();
}

export function dictValueParserTransferNotification(): DictionaryValue<TransferNotification> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTransferNotification(src)).endCell());
        },
        parse: (src) => {
            return loadTransferNotification(src.loadRef().beginParse());
        }
    }
}

export type Burn = {
    $$type: 'Burn';
    query_id: bigint;
    amount: bigint;
    response_destination: Address | null;
    custom_payload: Cell | null;
}

export function storeBurn(src: Burn) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1499400124, 32);
        b_0.storeUint(src.query_id, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.response_destination);
        if (src.custom_payload !== null && src.custom_payload !== undefined) { b_0.storeBit(true).storeRef(src.custom_payload); } else { b_0.storeBit(false); }
    };
}

export function loadBurn(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1499400124) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _response_destination = sc_0.loadMaybeAddress();
    const _custom_payload = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'Burn' as const, query_id: _query_id, amount: _amount, response_destination: _response_destination, custom_payload: _custom_payload };
}

export function loadTupleBurn(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _response_destination = source.readAddressOpt();
    const _custom_payload = source.readCellOpt();
    return { $$type: 'Burn' as const, query_id: _query_id, amount: _amount, response_destination: _response_destination, custom_payload: _custom_payload };
}

export function loadGetterTupleBurn(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _response_destination = source.readAddressOpt();
    const _custom_payload = source.readCellOpt();
    return { $$type: 'Burn' as const, query_id: _query_id, amount: _amount, response_destination: _response_destination, custom_payload: _custom_payload };
}

export function storeTupleBurn(source: Burn) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.response_destination);
    builder.writeCell(source.custom_payload);
    return builder.build();
}

export function dictValueParserBurn(): DictionaryValue<Burn> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBurn(src)).endCell());
        },
        parse: (src) => {
            return loadBurn(src.loadRef().beginParse());
        }
    }
}

export type BurnNotification = {
    $$type: 'BurnNotification';
    query_id: bigint;
    amount: bigint;
    sender: Address;
    response_destination: Address | null;
}

export function storeBurnNotification(src: BurnNotification) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2078119902, 32);
        b_0.storeUint(src.query_id, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.sender);
        b_0.storeAddress(src.response_destination);
    };
}

export function loadBurnNotification(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2078119902) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _sender = sc_0.loadAddress();
    const _response_destination = sc_0.loadMaybeAddress();
    return { $$type: 'BurnNotification' as const, query_id: _query_id, amount: _amount, sender: _sender, response_destination: _response_destination };
}

export function loadTupleBurnNotification(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _response_destination = source.readAddressOpt();
    return { $$type: 'BurnNotification' as const, query_id: _query_id, amount: _amount, sender: _sender, response_destination: _response_destination };
}

export function loadGetterTupleBurnNotification(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _response_destination = source.readAddressOpt();
    return { $$type: 'BurnNotification' as const, query_id: _query_id, amount: _amount, sender: _sender, response_destination: _response_destination };
}

export function storeTupleBurnNotification(source: BurnNotification) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.sender);
    builder.writeAddress(source.response_destination);
    return builder.build();
}

export function dictValueParserBurnNotification(): DictionaryValue<BurnNotification> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBurnNotification(src)).endCell());
        },
        parse: (src) => {
            return loadBurnNotification(src.loadRef().beginParse());
        }
    }
}

export type Excesses = {
    $$type: 'Excesses';
    query_id: bigint;
}

export function storeExcesses(src: Excesses) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3576854235, 32);
        b_0.storeUint(src.query_id, 64);
    };
}

export function loadExcesses(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3576854235) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    return { $$type: 'Excesses' as const, query_id: _query_id };
}

export function loadTupleExcesses(source: TupleReader) {
    const _query_id = source.readBigNumber();
    return { $$type: 'Excesses' as const, query_id: _query_id };
}

export function loadGetterTupleExcesses(source: TupleReader) {
    const _query_id = source.readBigNumber();
    return { $$type: 'Excesses' as const, query_id: _query_id };
}

export function storeTupleExcesses(source: Excesses) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    return builder.build();
}

export function dictValueParserExcesses(): DictionaryValue<Excesses> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeExcesses(src)).endCell());
        },
        parse: (src) => {
            return loadExcesses(src.loadRef().beginParse());
        }
    }
}

export type DeployJetton = {
    $$type: 'DeployJetton';
    owner: Address;
    content: Cell;
    max_supply: bigint;
    mint_price: bigint;
    mint_amount: bigint;
}

export function storeDeployJetton(src: DeployJetton) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1640691497, 32);
        b_0.storeAddress(src.owner);
        b_0.storeRef(src.content);
        b_0.storeCoins(src.max_supply);
        b_0.storeCoins(src.mint_price);
        b_0.storeCoins(src.mint_amount);
    };
}

export function loadDeployJetton(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1640691497) { throw Error('Invalid prefix'); }
    const _owner = sc_0.loadAddress();
    const _content = sc_0.loadRef();
    const _max_supply = sc_0.loadCoins();
    const _mint_price = sc_0.loadCoins();
    const _mint_amount = sc_0.loadCoins();
    return { $$type: 'DeployJetton' as const, owner: _owner, content: _content, max_supply: _max_supply, mint_price: _mint_price, mint_amount: _mint_amount };
}

export function loadTupleDeployJetton(source: TupleReader) {
    const _owner = source.readAddress();
    const _content = source.readCell();
    const _max_supply = source.readBigNumber();
    const _mint_price = source.readBigNumber();
    const _mint_amount = source.readBigNumber();
    return { $$type: 'DeployJetton' as const, owner: _owner, content: _content, max_supply: _max_supply, mint_price: _mint_price, mint_amount: _mint_amount };
}

export function loadGetterTupleDeployJetton(source: TupleReader) {
    const _owner = source.readAddress();
    const _content = source.readCell();
    const _max_supply = source.readBigNumber();
    const _mint_price = source.readBigNumber();
    const _mint_amount = source.readBigNumber();
    return { $$type: 'DeployJetton' as const, owner: _owner, content: _content, max_supply: _max_supply, mint_price: _mint_price, mint_amount: _mint_amount };
}

export function storeTupleDeployJetton(source: DeployJetton) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeCell(source.content);
    builder.writeNumber(source.max_supply);
    builder.writeNumber(source.mint_price);
    builder.writeNumber(source.mint_amount);
    return builder.build();
}

export function dictValueParserDeployJetton(): DictionaryValue<DeployJetton> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployJetton(src)).endCell());
        },
        parse: (src) => {
            return loadDeployJetton(src.loadRef().beginParse());
        }
    }
}

export type SetPublicMint = {
    $$type: 'SetPublicMint';
    enabled: boolean;
}

export function storeSetPublicMint(src: SetPublicMint) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(305419896, 32);
        b_0.storeBit(src.enabled);
    };
}

export function loadSetPublicMint(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 305419896) { throw Error('Invalid prefix'); }
    const _enabled = sc_0.loadBit();
    return { $$type: 'SetPublicMint' as const, enabled: _enabled };
}

export function loadTupleSetPublicMint(source: TupleReader) {
    const _enabled = source.readBoolean();
    return { $$type: 'SetPublicMint' as const, enabled: _enabled };
}

export function loadGetterTupleSetPublicMint(source: TupleReader) {
    const _enabled = source.readBoolean();
    return { $$type: 'SetPublicMint' as const, enabled: _enabled };
}

export function storeTupleSetPublicMint(source: SetPublicMint) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.enabled);
    return builder.build();
}

export function dictValueParserSetPublicMint(): DictionaryValue<SetPublicMint> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetPublicMint(src)).endCell());
        },
        parse: (src) => {
            return loadSetPublicMint(src.loadRef().beginParse());
        }
    }
}

export type SetBridgeMinter = {
    $$type: 'SetBridgeMinter';
    address: Address;
}

export function storeSetBridgeMinter(src: SetBridgeMinter) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2271560481, 32);
        b_0.storeAddress(src.address);
    };
}

export function loadSetBridgeMinter(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2271560481) { throw Error('Invalid prefix'); }
    const _address = sc_0.loadAddress();
    return { $$type: 'SetBridgeMinter' as const, address: _address };
}

export function loadTupleSetBridgeMinter(source: TupleReader) {
    const _address = source.readAddress();
    return { $$type: 'SetBridgeMinter' as const, address: _address };
}

export function loadGetterTupleSetBridgeMinter(source: TupleReader) {
    const _address = source.readAddress();
    return { $$type: 'SetBridgeMinter' as const, address: _address };
}

export function storeTupleSetBridgeMinter(source: SetBridgeMinter) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.address);
    return builder.build();
}

export function dictValueParserSetBridgeMinter(): DictionaryValue<SetBridgeMinter> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetBridgeMinter(src)).endCell());
        },
        parse: (src) => {
            return loadSetBridgeMinter(src.loadRef().beginParse());
        }
    }
}

export type BridgeMint = {
    $$type: 'BridgeMint';
    receiver: Address;
    amount: bigint;
}

export function storeBridgeMint(src: BridgeMint) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1964052753, 32);
        b_0.storeAddress(src.receiver);
        b_0.storeCoins(src.amount);
    };
}

export function loadBridgeMint(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1964052753) { throw Error('Invalid prefix'); }
    const _receiver = sc_0.loadAddress();
    const _amount = sc_0.loadCoins();
    return { $$type: 'BridgeMint' as const, receiver: _receiver, amount: _amount };
}

export function loadTupleBridgeMint(source: TupleReader) {
    const _receiver = source.readAddress();
    const _amount = source.readBigNumber();
    return { $$type: 'BridgeMint' as const, receiver: _receiver, amount: _amount };
}

export function loadGetterTupleBridgeMint(source: TupleReader) {
    const _receiver = source.readAddress();
    const _amount = source.readBigNumber();
    return { $$type: 'BridgeMint' as const, receiver: _receiver, amount: _amount };
}

export function storeTupleBridgeMint(source: BridgeMint) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.receiver);
    builder.writeNumber(source.amount);
    return builder.build();
}

export function dictValueParserBridgeMint(): DictionaryValue<BridgeMint> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBridgeMint(src)).endCell());
        },
        parse: (src) => {
            return loadBridgeMint(src.loadRef().beginParse());
        }
    }
}

export type SetWalletPause = {
    $$type: 'SetWalletPause';
    paused: boolean;
}

export function storeSetWalletPause(src: SetWalletPause) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(286331153, 32);
        b_0.storeBit(src.paused);
    };
}

export function loadSetWalletPause(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 286331153) { throw Error('Invalid prefix'); }
    const _paused = sc_0.loadBit();
    return { $$type: 'SetWalletPause' as const, paused: _paused };
}

export function loadTupleSetWalletPause(source: TupleReader) {
    const _paused = source.readBoolean();
    return { $$type: 'SetWalletPause' as const, paused: _paused };
}

export function loadGetterTupleSetWalletPause(source: TupleReader) {
    const _paused = source.readBoolean();
    return { $$type: 'SetWalletPause' as const, paused: _paused };
}

export function storeTupleSetWalletPause(source: SetWalletPause) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.paused);
    return builder.build();
}

export function dictValueParserSetWalletPause(): DictionaryValue<SetWalletPause> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetWalletPause(src)).endCell());
        },
        parse: (src) => {
            return loadSetWalletPause(src.loadRef().beginParse());
        }
    }
}

export type RequestWalletPause = {
    $$type: 'RequestWalletPause';
    user: Address;
    paused: boolean;
}

export function storeRequestWalletPause(src: RequestWalletPause) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(572662306, 32);
        b_0.storeAddress(src.user);
        b_0.storeBit(src.paused);
    };
}

export function loadRequestWalletPause(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 572662306) { throw Error('Invalid prefix'); }
    const _user = sc_0.loadAddress();
    const _paused = sc_0.loadBit();
    return { $$type: 'RequestWalletPause' as const, user: _user, paused: _paused };
}

export function loadTupleRequestWalletPause(source: TupleReader) {
    const _user = source.readAddress();
    const _paused = source.readBoolean();
    return { $$type: 'RequestWalletPause' as const, user: _user, paused: _paused };
}

export function loadGetterTupleRequestWalletPause(source: TupleReader) {
    const _user = source.readAddress();
    const _paused = source.readBoolean();
    return { $$type: 'RequestWalletPause' as const, user: _user, paused: _paused };
}

export function storeTupleRequestWalletPause(source: RequestWalletPause) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.user);
    builder.writeBoolean(source.paused);
    return builder.build();
}

export function dictValueParserRequestWalletPause(): DictionaryValue<RequestWalletPause> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeRequestWalletPause(src)).endCell());
        },
        parse: (src) => {
            return loadRequestWalletPause(src.loadRef().beginParse());
        }
    }
}

export type Pause = {
    $$type: 'Pause';
}

export function storePause(src: Pause) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(268435457, 32);
    };
}

export function loadPause(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 268435457) { throw Error('Invalid prefix'); }
    return { $$type: 'Pause' as const };
}

export function loadTuplePause(source: TupleReader) {
    return { $$type: 'Pause' as const };
}

export function loadGetterTuplePause(source: TupleReader) {
    return { $$type: 'Pause' as const };
}

export function storeTuplePause(source: Pause) {
    const builder = new TupleBuilder();
    return builder.build();
}

export function dictValueParserPause(): DictionaryValue<Pause> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storePause(src)).endCell());
        },
        parse: (src) => {
            return loadPause(src.loadRef().beginParse());
        }
    }
}

export type Unpause = {
    $$type: 'Unpause';
}

export function storeUnpause(src: Unpause) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(268435458, 32);
    };
}

export function loadUnpause(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 268435458) { throw Error('Invalid prefix'); }
    return { $$type: 'Unpause' as const };
}

export function loadTupleUnpause(source: TupleReader) {
    return { $$type: 'Unpause' as const };
}

export function loadGetterTupleUnpause(source: TupleReader) {
    return { $$type: 'Unpause' as const };
}

export function storeTupleUnpause(source: Unpause) {
    const builder = new TupleBuilder();
    return builder.build();
}

export function dictValueParserUnpause(): DictionaryValue<Unpause> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeUnpause(src)).endCell());
        },
        parse: (src) => {
            return loadUnpause(src.loadRef().beginParse());
        }
    }
}

export type SetGuardian = {
    $$type: 'SetGuardian';
    address: Address;
}

export function storeSetGuardian(src: SetGuardian) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(268435459, 32);
        b_0.storeAddress(src.address);
    };
}

export function loadSetGuardian(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 268435459) { throw Error('Invalid prefix'); }
    const _address = sc_0.loadAddress();
    return { $$type: 'SetGuardian' as const, address: _address };
}

export function loadTupleSetGuardian(source: TupleReader) {
    const _address = source.readAddress();
    return { $$type: 'SetGuardian' as const, address: _address };
}

export function loadGetterTupleSetGuardian(source: TupleReader) {
    const _address = source.readAddress();
    return { $$type: 'SetGuardian' as const, address: _address };
}

export function storeTupleSetGuardian(source: SetGuardian) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.address);
    return builder.build();
}

export function dictValueParserSetGuardian(): DictionaryValue<SetGuardian> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetGuardian(src)).endCell());
        },
        parse: (src) => {
            return loadSetGuardian(src.loadRef().beginParse());
        }
    }
}

export type SetTreasury = {
    $$type: 'SetTreasury';
    address: Address;
}

export function storeSetTreasury(src: SetTreasury) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(268435460, 32);
        b_0.storeAddress(src.address);
    };
}

export function loadSetTreasury(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 268435460) { throw Error('Invalid prefix'); }
    const _address = sc_0.loadAddress();
    return { $$type: 'SetTreasury' as const, address: _address };
}

export function loadTupleSetTreasury(source: TupleReader) {
    const _address = source.readAddress();
    return { $$type: 'SetTreasury' as const, address: _address };
}

export function loadGetterTupleSetTreasury(source: TupleReader) {
    const _address = source.readAddress();
    return { $$type: 'SetTreasury' as const, address: _address };
}

export function storeTupleSetTreasury(source: SetTreasury) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.address);
    return builder.build();
}

export function dictValueParserSetTreasury(): DictionaryValue<SetTreasury> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetTreasury(src)).endCell());
        },
        parse: (src) => {
            return loadSetTreasury(src.loadRef().beginParse());
        }
    }
}

export type SetFee = {
    $$type: 'SetFee';
    bps: bigint;
}

export function storeSetFee(src: SetFee) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(268435461, 32);
        b_0.storeInt(src.bps, 257);
    };
}

export function loadSetFee(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 268435461) { throw Error('Invalid prefix'); }
    const _bps = sc_0.loadIntBig(257);
    return { $$type: 'SetFee' as const, bps: _bps };
}

export function loadTupleSetFee(source: TupleReader) {
    const _bps = source.readBigNumber();
    return { $$type: 'SetFee' as const, bps: _bps };
}

export function loadGetterTupleSetFee(source: TupleReader) {
    const _bps = source.readBigNumber();
    return { $$type: 'SetFee' as const, bps: _bps };
}

export function storeTupleSetFee(source: SetFee) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.bps);
    return builder.build();
}

export function dictValueParserSetFee(): DictionaryValue<SetFee> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetFee(src)).endCell());
        },
        parse: (src) => {
            return loadSetFee(src.loadRef().beginParse());
        }
    }
}

export type NeoJettonMinter$Data = {
    $$type: 'NeoJettonMinter$Data';
    total_supply: bigint;
    owner: Address;
    content: Cell;
    max_supply: bigint;
    mint_price: bigint;
    mint_amount: bigint;
    public_mint_enabled: boolean;
    bridge_minter: Address | null;
    paused: boolean;
    guardian: Address;
    treasury: Address;
    fee_bps: bigint;
    minters: Dictionary<Address, boolean>;
}

export function storeNeoJettonMinter$Data(src: NeoJettonMinter$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.total_supply);
        b_0.storeAddress(src.owner);
        b_0.storeRef(src.content);
        b_0.storeCoins(src.max_supply);
        b_0.storeCoins(src.mint_price);
        b_0.storeCoins(src.mint_amount);
        b_0.storeBit(src.public_mint_enabled);
        const b_1 = new Builder();
        b_1.storeAddress(src.bridge_minter);
        b_1.storeBit(src.paused);
        b_1.storeAddress(src.guardian);
        b_1.storeAddress(src.treasury);
        const b_2 = new Builder();
        b_2.storeInt(src.fee_bps, 257);
        b_2.storeDict(src.minters, Dictionary.Keys.Address(), Dictionary.Values.Bool());
        b_1.storeRef(b_2.endCell());
        b_0.storeRef(b_1.endCell());
    };
}

export function loadNeoJettonMinter$Data(slice: Slice) {
    const sc_0 = slice;
    const _total_supply = sc_0.loadCoins();
    const _owner = sc_0.loadAddress();
    const _content = sc_0.loadRef();
    const _max_supply = sc_0.loadCoins();
    const _mint_price = sc_0.loadCoins();
    const _mint_amount = sc_0.loadCoins();
    const _public_mint_enabled = sc_0.loadBit();
    const sc_1 = sc_0.loadRef().beginParse();
    const _bridge_minter = sc_1.loadMaybeAddress();
    const _paused = sc_1.loadBit();
    const _guardian = sc_1.loadAddress();
    const _treasury = sc_1.loadAddress();
    const sc_2 = sc_1.loadRef().beginParse();
    const _fee_bps = sc_2.loadIntBig(257);
    const _minters = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.Bool(), sc_2);
    return { $$type: 'NeoJettonMinter$Data' as const, total_supply: _total_supply, owner: _owner, content: _content, max_supply: _max_supply, mint_price: _mint_price, mint_amount: _mint_amount, public_mint_enabled: _public_mint_enabled, bridge_minter: _bridge_minter, paused: _paused, guardian: _guardian, treasury: _treasury, fee_bps: _fee_bps, minters: _minters };
}

export function loadTupleNeoJettonMinter$Data(source: TupleReader) {
    const _total_supply = source.readBigNumber();
    const _owner = source.readAddress();
    const _content = source.readCell();
    const _max_supply = source.readBigNumber();
    const _mint_price = source.readBigNumber();
    const _mint_amount = source.readBigNumber();
    const _public_mint_enabled = source.readBoolean();
    const _bridge_minter = source.readAddressOpt();
    const _paused = source.readBoolean();
    const _guardian = source.readAddress();
    const _treasury = source.readAddress();
    const _fee_bps = source.readBigNumber();
    const _minters = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.Bool(), source.readCellOpt());
    return { $$type: 'NeoJettonMinter$Data' as const, total_supply: _total_supply, owner: _owner, content: _content, max_supply: _max_supply, mint_price: _mint_price, mint_amount: _mint_amount, public_mint_enabled: _public_mint_enabled, bridge_minter: _bridge_minter, paused: _paused, guardian: _guardian, treasury: _treasury, fee_bps: _fee_bps, minters: _minters };
}

export function loadGetterTupleNeoJettonMinter$Data(source: TupleReader) {
    const _total_supply = source.readBigNumber();
    const _owner = source.readAddress();
    const _content = source.readCell();
    const _max_supply = source.readBigNumber();
    const _mint_price = source.readBigNumber();
    const _mint_amount = source.readBigNumber();
    const _public_mint_enabled = source.readBoolean();
    const _bridge_minter = source.readAddressOpt();
    const _paused = source.readBoolean();
    const _guardian = source.readAddress();
    const _treasury = source.readAddress();
    const _fee_bps = source.readBigNumber();
    const _minters = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.Bool(), source.readCellOpt());
    return { $$type: 'NeoJettonMinter$Data' as const, total_supply: _total_supply, owner: _owner, content: _content, max_supply: _max_supply, mint_price: _mint_price, mint_amount: _mint_amount, public_mint_enabled: _public_mint_enabled, bridge_minter: _bridge_minter, paused: _paused, guardian: _guardian, treasury: _treasury, fee_bps: _fee_bps, minters: _minters };
}

export function storeTupleNeoJettonMinter$Data(source: NeoJettonMinter$Data) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.total_supply);
    builder.writeAddress(source.owner);
    builder.writeCell(source.content);
    builder.writeNumber(source.max_supply);
    builder.writeNumber(source.mint_price);
    builder.writeNumber(source.mint_amount);
    builder.writeBoolean(source.public_mint_enabled);
    builder.writeAddress(source.bridge_minter);
    builder.writeBoolean(source.paused);
    builder.writeAddress(source.guardian);
    builder.writeAddress(source.treasury);
    builder.writeNumber(source.fee_bps);
    builder.writeCell(source.minters.size > 0 ? beginCell().storeDictDirect(source.minters, Dictionary.Keys.Address(), Dictionary.Values.Bool()).endCell() : null);
    return builder.build();
}

export function dictValueParserNeoJettonMinter$Data(): DictionaryValue<NeoJettonMinter$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeNeoJettonMinter$Data(src)).endCell());
        },
        parse: (src) => {
            return loadNeoJettonMinter$Data(src.loadRef().beginParse());
        }
    }
}

export type JettonData = {
    $$type: 'JettonData';
    total_supply: bigint;
    mintable: boolean;
    admin_address: Address;
    content: Cell;
    wallet_code: Cell;
}

export function storeJettonData(src: JettonData) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.total_supply, 257);
        b_0.storeBit(src.mintable);
        b_0.storeAddress(src.admin_address);
        b_0.storeRef(src.content);
        b_0.storeRef(src.wallet_code);
    };
}

export function loadJettonData(slice: Slice) {
    const sc_0 = slice;
    const _total_supply = sc_0.loadIntBig(257);
    const _mintable = sc_0.loadBit();
    const _admin_address = sc_0.loadAddress();
    const _content = sc_0.loadRef();
    const _wallet_code = sc_0.loadRef();
    return { $$type: 'JettonData' as const, total_supply: _total_supply, mintable: _mintable, admin_address: _admin_address, content: _content, wallet_code: _wallet_code };
}

export function loadTupleJettonData(source: TupleReader) {
    const _total_supply = source.readBigNumber();
    const _mintable = source.readBoolean();
    const _admin_address = source.readAddress();
    const _content = source.readCell();
    const _wallet_code = source.readCell();
    return { $$type: 'JettonData' as const, total_supply: _total_supply, mintable: _mintable, admin_address: _admin_address, content: _content, wallet_code: _wallet_code };
}

export function loadGetterTupleJettonData(source: TupleReader) {
    const _total_supply = source.readBigNumber();
    const _mintable = source.readBoolean();
    const _admin_address = source.readAddress();
    const _content = source.readCell();
    const _wallet_code = source.readCell();
    return { $$type: 'JettonData' as const, total_supply: _total_supply, mintable: _mintable, admin_address: _admin_address, content: _content, wallet_code: _wallet_code };
}

export function storeTupleJettonData(source: JettonData) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.total_supply);
    builder.writeBoolean(source.mintable);
    builder.writeAddress(source.admin_address);
    builder.writeCell(source.content);
    builder.writeCell(source.wallet_code);
    return builder.build();
}

export function dictValueParserJettonData(): DictionaryValue<JettonData> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonData(src)).endCell());
        },
        parse: (src) => {
            return loadJettonData(src.loadRef().beginParse());
        }
    }
}

export type NeoJettonWallet$Data = {
    $$type: 'NeoJettonWallet$Data';
    balance: bigint;
    owner: Address;
    master: Address;
    paused: boolean;
}

export function storeNeoJettonWallet$Data(src: NeoJettonWallet$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.balance);
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.master);
        b_0.storeBit(src.paused);
    };
}

export function loadNeoJettonWallet$Data(slice: Slice) {
    const sc_0 = slice;
    const _balance = sc_0.loadCoins();
    const _owner = sc_0.loadAddress();
    const _master = sc_0.loadAddress();
    const _paused = sc_0.loadBit();
    return { $$type: 'NeoJettonWallet$Data' as const, balance: _balance, owner: _owner, master: _master, paused: _paused };
}

export function loadTupleNeoJettonWallet$Data(source: TupleReader) {
    const _balance = source.readBigNumber();
    const _owner = source.readAddress();
    const _master = source.readAddress();
    const _paused = source.readBoolean();
    return { $$type: 'NeoJettonWallet$Data' as const, balance: _balance, owner: _owner, master: _master, paused: _paused };
}

export function loadGetterTupleNeoJettonWallet$Data(source: TupleReader) {
    const _balance = source.readBigNumber();
    const _owner = source.readAddress();
    const _master = source.readAddress();
    const _paused = source.readBoolean();
    return { $$type: 'NeoJettonWallet$Data' as const, balance: _balance, owner: _owner, master: _master, paused: _paused };
}

export function storeTupleNeoJettonWallet$Data(source: NeoJettonWallet$Data) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.balance);
    builder.writeAddress(source.owner);
    builder.writeAddress(source.master);
    builder.writeBoolean(source.paused);
    return builder.build();
}

export function dictValueParserNeoJettonWallet$Data(): DictionaryValue<NeoJettonWallet$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeNeoJettonWallet$Data(src)).endCell());
        },
        parse: (src) => {
            return loadNeoJettonWallet$Data(src.loadRef().beginParse());
        }
    }
}

export type WalletData = {
    $$type: 'WalletData';
    balance: bigint;
    owner: Address;
    master: Address;
    paused: boolean;
}

export function storeWalletData(src: WalletData) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.balance, 257);
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.master);
        b_0.storeBit(src.paused);
    };
}

export function loadWalletData(slice: Slice) {
    const sc_0 = slice;
    const _balance = sc_0.loadIntBig(257);
    const _owner = sc_0.loadAddress();
    const _master = sc_0.loadAddress();
    const _paused = sc_0.loadBit();
    return { $$type: 'WalletData' as const, balance: _balance, owner: _owner, master: _master, paused: _paused };
}

export function loadTupleWalletData(source: TupleReader) {
    const _balance = source.readBigNumber();
    const _owner = source.readAddress();
    const _master = source.readAddress();
    const _paused = source.readBoolean();
    return { $$type: 'WalletData' as const, balance: _balance, owner: _owner, master: _master, paused: _paused };
}

export function loadGetterTupleWalletData(source: TupleReader) {
    const _balance = source.readBigNumber();
    const _owner = source.readAddress();
    const _master = source.readAddress();
    const _paused = source.readBoolean();
    return { $$type: 'WalletData' as const, balance: _balance, owner: _owner, master: _master, paused: _paused };
}

export function storeTupleWalletData(source: WalletData) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.balance);
    builder.writeAddress(source.owner);
    builder.writeAddress(source.master);
    builder.writeBoolean(source.paused);
    return builder.build();
}

export function dictValueParserWalletData(): DictionaryValue<WalletData> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeWalletData(src)).endCell());
        },
        parse: (src) => {
            return loadWalletData(src.loadRef().beginParse());
        }
    }
}

export type NeoJettonFactory$Data = {
    $$type: 'NeoJettonFactory$Data';
    owner: Address;
    treasury: Address;
    guardian: Address;
    paused: boolean;
    fee_bps: bigint;
}

export function storeNeoJettonFactory$Data(src: NeoJettonFactory$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.treasury);
        b_0.storeAddress(src.guardian);
        b_0.storeBit(src.paused);
        const b_1 = new Builder();
        b_1.storeInt(src.fee_bps, 257);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadNeoJettonFactory$Data(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _treasury = sc_0.loadAddress();
    const _guardian = sc_0.loadAddress();
    const _paused = sc_0.loadBit();
    const sc_1 = sc_0.loadRef().beginParse();
    const _fee_bps = sc_1.loadIntBig(257);
    return { $$type: 'NeoJettonFactory$Data' as const, owner: _owner, treasury: _treasury, guardian: _guardian, paused: _paused, fee_bps: _fee_bps };
}

export function loadTupleNeoJettonFactory$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _treasury = source.readAddress();
    const _guardian = source.readAddress();
    const _paused = source.readBoolean();
    const _fee_bps = source.readBigNumber();
    return { $$type: 'NeoJettonFactory$Data' as const, owner: _owner, treasury: _treasury, guardian: _guardian, paused: _paused, fee_bps: _fee_bps };
}

export function loadGetterTupleNeoJettonFactory$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _treasury = source.readAddress();
    const _guardian = source.readAddress();
    const _paused = source.readBoolean();
    const _fee_bps = source.readBigNumber();
    return { $$type: 'NeoJettonFactory$Data' as const, owner: _owner, treasury: _treasury, guardian: _guardian, paused: _paused, fee_bps: _fee_bps };
}

export function storeTupleNeoJettonFactory$Data(source: NeoJettonFactory$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeAddress(source.treasury);
    builder.writeAddress(source.guardian);
    builder.writeBoolean(source.paused);
    builder.writeNumber(source.fee_bps);
    return builder.build();
}

export function dictValueParserNeoJettonFactory$Data(): DictionaryValue<NeoJettonFactory$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeNeoJettonFactory$Data(src)).endCell());
        },
        parse: (src) => {
            return loadNeoJettonFactory$Data(src.loadRef().beginParse());
        }
    }
}

 type NeoJettonMinter_init_args = {
    $$type: 'NeoJettonMinter_init_args';
    owner: Address;
    content: Cell;
    max: bigint;
    price: bigint;
    amount: bigint;
    treasury: Address;
}

function initNeoJettonMinter_init_args(src: NeoJettonMinter_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeRef(src.content);
        b_0.storeInt(src.max, 257);
        b_0.storeInt(src.price, 257);
        const b_1 = new Builder();
        b_1.storeInt(src.amount, 257);
        b_1.storeAddress(src.treasury);
        b_0.storeRef(b_1.endCell());
    };
}

async function NeoJettonMinter_init(owner: Address, content: Cell, max: bigint, price: bigint, amount: bigint, treasury: Address) {
    const __code = Cell.fromHex('b5ee9c7241024101000eb7000114ff00f4a413f4bcf2c80b01020162021803dcd0eda2edfb01d072d721d200d200fa4021103450666f04f86102f862ed44d0d200018e38fa40d4810101d700810101d700d401d0810101d700fa4030102610251024102306d15504707f6d7029104a0908070605103441308101f46de30d0e925f0ee02cd749c21fe3000cf9012022031004e80cd31f2182107bdd97deba8fde31d33ffa00fa40d72c01916d93fa4001e231f82812db3c82008cf8f8425a705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d0c705f2f450dda12c6eb3923c30e30d10ac5519e021821010000001ba24040f05009870804003c8018210d53276db58cb1fcb3fc9103e41e05a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0002fe8e6b5b328200a5c3f8422ac705917f95f84222c705e2f2f4109b108a1079106810571046103510247f5034c87f01ca0055c050dcfa021ace18cc5006fa025004fa0258fa02ca00c858206e9430cf84809201cee212ca0012ce12ce03c8810101cf0012f40012cdcdc9ed54db31e021821010000002bae30221821010000003060700be5b32f84229c705f2e5f1109b108a107910681057104610351024705034c87f01ca0055c050dcfa021ace18cc5006fa025004fa0258fa02ca00c858206e9430cf84809201cee212ca0012ce12ce03c8810101cf0012f40012cdcdc9ed54db3103feba8ef031fa403010bc10ab109a108910781067105610451034413ddb3c3310bc10ab109a10891078106710561045103458c87f01ca0055c050dcfa021ace18cc5006fa025004fa0258fa02ca00c858206e9430cf84809201cee212ca0012ce12ce03c8810101cf0012f40012cdcdc9ed54db31e021821010000004bae3022116080901e231fa403010bc10ab109a108910781067105610451034413ddb3c3210bc10ab109a1089107810671056104510344300c87f01ca0055c050dcfa021ace18cc5006fa025004fa0258fa02ca00c858206e9430cf84809201cee212ca0012ce12ce03c8810101cf0012f40012cdcdc9ed54db311603fe821012345678ba8eeb31d2003010bc10ab109a108910781067105610451034413ddb3c3610bc10ab109a1089107810675504c87f01ca0055c050dcfa021ace18cc5006fa025004fa0258fa02ca00c858206e9430cf84809201cee212ca0012ce12ce03c8810101cf0012f40012cdcdc9ed54db31e021821022222222bae302160a0c04fe31fa40d2003050dedb3cf8281edb3c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d08208989680711110c80182101111111158cb1fca00c94130011110015a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf818ae2f400c9011624310b008cfb00551ac87f01ca0055c050dcfa021ace18cc5006fa025004fa0258fa02ca00c858206e9430cf84809201cee212ca0012ce12ce03c8810101cf0012f40012cdcdc9ed54db3102fe21821087654321ba8eed31fa403010bc10ab109a108910781067105610451034413ddb3c3510bc10ab109a10891078106710565503c87f01ca0055c050dcfa021ace18cc5006fa025004fa0258fa02ca00c858206e9430cf84809201cee212ca0012ce12ce03c8810101cf0012f40012cdcdc9ed54db31e021821075111111160d03c6ba8f5431fa40fa0030f8416f2410235f03814d5026b3f2f4820092235317206e925b7092c705e292317f94511dc705e2f2f48200ba6253d1a02bbbf2f451cca00e10bd10ac109b108a107910681057104610354014db3ce0018210946a98b6bae3020c120f0e0190d33f30c8018210aff90f5758cb1fcb3fc910bd10ac109b108a107910681057104610354430f84270705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb000f0084c87f01ca0055c050dcfa021ace18cc5006fa025004fa0258fa02ca00c858206e9430cf84809201cee212ca0012ce12ce03c8810101cf0012f40012cdcdc9ed54db31029e82f0753a71dc74e6b4478f82746d73660ad7945b48893674e08e6e377388bc41c98fbae30282f0158e394e7cc73a9aeb362957fe037665588aef16f3bd68580c13ab84097cf22abae3025f0df2c082111502fc30f8416f243032814d5025b3f2f481585727f2f48200cfa429820afaf080a013be12f2f48200ba6253c7a02abbf2f48200c9e72e81010b23714133f40a6fa19401d70030925b6de26ef2f40d81010b2e7f71216e955b59f4593098c801cf004133f441e251b6a00d2610bd10ac109b108a0910681057104610354413db3c121402f6f8285220db3c5c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d08209c9c3807170f828218b08103510491023102ac85550821005138d915007cb1f15cb3f5003fa02ce01206e9430cf84809201cee201fa02cec950521413103555127fc8cf858024130058ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb000080c87f01ca0055c050dcfa021ace18cc5006fa025004fa0258fa02ca00c858206e9430cf84809201cee212ca0012ce12ce03c8810101cf0012f40012cdcdc9ed5402ae10ac5519db3cf8276f10820afaf080a120c2009130e30dc87f01ca0055c050dcfa021ace18cc5006fa025004fa0258fa02ca00c858206e9430cf84809201cee212ca0012ce12ce03c8810101cf0012f40012cdcdc9ed5416170010f8422cc705f2e08400fa5302a8812710a9045340716d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00a152c0716d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00020120191e0201581a1c0291b4a3bda89a1a400031c71f481a9020203ae01020203ae01a803a1020203ae01f48060204c204a204820460da2aa08e0fedae052209412100e0c0a206882610203e8dbc61bb678d9a30221b00022b0291b66f5da89a1a400031c71f481a9020203ae01020203ae01a803a1020203ae01f48060204c204a204820460da2aa08e0fedae052209412100e0c0a206882610203e8dbc61bb678d9a30221d0002240202711f210295adbcf6a268690000c71c7d206a408080eb80408080eb806a00e8408080eb807d201808130812881208118368aa82383fb6b81488250484038302881a20984080fa36f186aa866d9e3668c022200162f828db3c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d0240291af16f6a268690000c71c7d206a408080eb80408080eb806a00e8408080eb807d201808130812881208118368aa82383fb6b81488250484038302881a20984080fa36f186ed9e366ac022230078fa00fa40d4fa00fa00fa00d200d401d0d72c01916d93fa4001e201d200fa40fa40d430d0810101d700f40430106d106c106b106a1069106810676c1d011a7ff82852d0db3c302e59546ee024011688c87001ca005a02cecec9250114ff00f4a413f4bcf2c80b26020162273301f2d001d072d721d200d200fa4021103450666f04f86102f862ed44d0d200019cfa00fa40fa40d20055306c149bfa40fa405902d101705970e2058e35038020d7218020d721d31f01821005138d91ba99d33f31fa003012a0019130e24003c87f01ca0055305043fa02ce12ceca00c9ed54e003d70d1ff2e082212804e4821005138d91ba8ecc31d33ffa00fa40d72c01916d93fa4001e230fa00f8416f245b81114d3229c705917f95f84229c705e2f2f45163a021c20093365f04e30d4003c87f01ca0055305043fa02ce12ceca00c9ed54e021821075097f5dbae30221821011111111bae302018210595f07bcba292a2d2e00a844347107c8553082107362d09c5005cb1f13cb3f01fa02cecec9230350555a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0002f431d33ffa00fa40d72c01916d93fa4001e201f40431fa00f8416f2410235f038200f8b72bb3f2f48111b25118c705f2f48200d5575385bef2f45174a15138db3c5c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d050767080407f2b4813507dc82b2c0018f82ac87001ca005a02cecec900ee5550821005138d915007cb1f15cb3f5003fa02ce01206e9430cf84809201cee201fa02cec910561058103440130810465522c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb004003c87f01ca0055305043fa02ce12ceca00c9ed54004a313403d2003081771bf84224c705f2f44330c87f01ca0055305043fa02ce12ceca00c9ed54010ee3025f05f2c0822f03fed33ffa00d72c01916d93fa4001e231f8416f2410235f038200f8b728b3f2f48111b25115c705f2f48200d5575352bef2f45141a170541324804007c8553082107bdd97de5005cb1f13cb3f01fa02ce01206e9430cf84809201cee2c9250350555a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb08a8a30313200065bcf81001a58cf8680cf8480f400f400cf810038e2f400c901fb004003c87f01ca0055305043fa02ce12ceca00c9ed54020120343c0201203537014db996eed44d0d200019cfa00fa40fa40d20055306c149bfa40fa405902d101705970e2db3c6c44836000854732123020120383a014db4a3bda89a1a4000339f401f481f481a400aa60d82937f481f480b205a202e0b2e1c5b678d883039000222014db66f5da89a1a4000339f401f481f481a400aa60d82937f481f480b205a202e0b2e1c5b678d88303b0002200201203d3f014db96c0ed44d0d200019cfa00fa40fa40d20055306c149bfa40fa405902d101705970e2db3c6c4183e000223014db95bded44d0d200019cfa00fa40fa40d20055306c149bfa40fa405902d101705970e2db3c6c4184000022134f6abec');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initNeoJettonMinter_init_args({ $$type: 'NeoJettonMinter_init_args', owner, content, max, price, amount, treasury })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const NeoJettonMinter_errors = {
    2: { message: "Stack underflow" },
    3: { message: "Stack overflow" },
    4: { message: "Integer overflow" },
    5: { message: "Integer out of expected range" },
    6: { message: "Invalid opcode" },
    7: { message: "Type check error" },
    8: { message: "Cell overflow" },
    9: { message: "Cell underflow" },
    10: { message: "Dictionary error" },
    11: { message: "'Unknown' error" },
    12: { message: "Fatal error" },
    13: { message: "Out of gas error" },
    14: { message: "Virtualization error" },
    32: { message: "Action list is invalid" },
    33: { message: "Action list is too long" },
    34: { message: "Action is invalid or not supported" },
    35: { message: "Invalid source address in outbound message" },
    36: { message: "Invalid destination address in outbound message" },
    37: { message: "Not enough Toncoin" },
    38: { message: "Not enough extra currencies" },
    39: { message: "Outbound message does not fit into a cell after rewriting" },
    40: { message: "Cannot process a message" },
    41: { message: "Library reference is null" },
    42: { message: "Library change action error" },
    43: { message: "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree" },
    50: { message: "Account state size exceeded limits" },
    128: { message: "Null reference exception" },
    129: { message: "Invalid serialization prefix" },
    130: { message: "Invalid incoming message" },
    131: { message: "Constraints error" },
    132: { message: "Access denied" },
    133: { message: "Contract stopped" },
    134: { message: "Invalid argument" },
    135: { message: "Code of a contract was not found" },
    136: { message: "Invalid standard address" },
    138: { message: "Not a basechain address" },
    1521: { message: "Only owner can unpause" },
    4429: { message: "Invalid sender" },
    4530: { message: "Invalid owner" },
    5239: { message: "Insufficient TON for factory deploy" },
    19792: { message: "Contract is paused" },
    22615: { message: "Mint disabled" },
    30491: { message: "Only master can pause wallets" },
    36088: { message: "Invalid wallet" },
    37411: { message: "Not authorized for bridge mint" },
    42435: { message: "Not authorized" },
    46136: { message: "Fee too high" },
    47714: { message: "Max supply reached" },
    49334: { message: "Invalid supply" },
    51687: { message: "Already minted" },
    53156: { message: "Insufficient TON for fees" },
    54615: { message: "Insufficient balance" },
    60484: { message: "Supply too high" },
    61788: { message: "Factory is paused" },
    63671: { message: "Wallet is paused" },
} as const

export const NeoJettonMinter_errors_backward = {
    "Stack underflow": 2,
    "Stack overflow": 3,
    "Integer overflow": 4,
    "Integer out of expected range": 5,
    "Invalid opcode": 6,
    "Type check error": 7,
    "Cell overflow": 8,
    "Cell underflow": 9,
    "Dictionary error": 10,
    "'Unknown' error": 11,
    "Fatal error": 12,
    "Out of gas error": 13,
    "Virtualization error": 14,
    "Action list is invalid": 32,
    "Action list is too long": 33,
    "Action is invalid or not supported": 34,
    "Invalid source address in outbound message": 35,
    "Invalid destination address in outbound message": 36,
    "Not enough Toncoin": 37,
    "Not enough extra currencies": 38,
    "Outbound message does not fit into a cell after rewriting": 39,
    "Cannot process a message": 40,
    "Library reference is null": 41,
    "Library change action error": 42,
    "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree": 43,
    "Account state size exceeded limits": 50,
    "Null reference exception": 128,
    "Invalid serialization prefix": 129,
    "Invalid incoming message": 130,
    "Constraints error": 131,
    "Access denied": 132,
    "Contract stopped": 133,
    "Invalid argument": 134,
    "Code of a contract was not found": 135,
    "Invalid standard address": 136,
    "Not a basechain address": 138,
    "Only owner can unpause": 1521,
    "Invalid sender": 4429,
    "Invalid owner": 4530,
    "Insufficient TON for factory deploy": 5239,
    "Contract is paused": 19792,
    "Mint disabled": 22615,
    "Only master can pause wallets": 30491,
    "Invalid wallet": 36088,
    "Not authorized for bridge mint": 37411,
    "Not authorized": 42435,
    "Fee too high": 46136,
    "Max supply reached": 47714,
    "Invalid supply": 49334,
    "Already minted": 51687,
    "Insufficient TON for fees": 53156,
    "Insufficient balance": 54615,
    "Supply too high": 60484,
    "Factory is paused": 61788,
    "Wallet is paused": 63671,
} as const

const NeoJettonMinter_types: ABIType[] = [
    {"name":"DataSize","header":null,"fields":[{"name":"cells","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bits","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"refs","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"SignedBundle","header":null,"fields":[{"name":"signature","type":{"kind":"simple","type":"fixed-bytes","optional":false,"format":64}},{"name":"signedData","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"StateInit","header":null,"fields":[{"name":"code","type":{"kind":"simple","type":"cell","optional":false}},{"name":"data","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"Context","header":null,"fields":[{"name":"bounceable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"raw","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"SendParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"code","type":{"kind":"simple","type":"cell","optional":true}},{"name":"data","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"MessageParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"DeployParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}},{"name":"init","type":{"kind":"simple","type":"StateInit","optional":false}}]},
    {"name":"StdAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":8}},{"name":"address","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"VarAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":32}},{"name":"address","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"BasechainAddress","header":null,"fields":[{"name":"hash","type":{"kind":"simple","type":"int","optional":true,"format":257}}]},
    {"name":"ChangeOwner","header":2174598809,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"newOwner","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"ChangeOwnerOk","header":846932810,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"newOwner","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"Deploy","header":2490013878,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"DeployOk","header":2952335191,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"FactoryDeploy","header":1829761339,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"cashback","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"Transfer","header":1963556701,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"destination","type":{"kind":"simple","type":"address","optional":false}},{"name":"response_destination","type":{"kind":"simple","type":"address","optional":true}},{"name":"custom_payload","type":{"kind":"simple","type":"cell","optional":true}},{"name":"forward_ton_amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"forward_payload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"InternalTransfer","header":85167505,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"from","type":{"kind":"simple","type":"address","optional":false}},{"name":"response_address","type":{"kind":"simple","type":"address","optional":true}},{"name":"forward_ton_amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"forward_payload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"TransferNotification","header":1935855772,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"forward_payload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"Burn","header":1499400124,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"response_destination","type":{"kind":"simple","type":"address","optional":true}},{"name":"custom_payload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"BurnNotification","header":2078119902,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"response_destination","type":{"kind":"simple","type":"address","optional":true}}]},
    {"name":"Excesses","header":3576854235,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"DeployJetton","header":1640691497,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"content","type":{"kind":"simple","type":"cell","optional":false}},{"name":"max_supply","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"mint_price","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"mint_amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"SetPublicMint","header":305419896,"fields":[{"name":"enabled","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"SetBridgeMinter","header":2271560481,"fields":[{"name":"address","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"BridgeMint","header":1964052753,"fields":[{"name":"receiver","type":{"kind":"simple","type":"address","optional":false}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"SetWalletPause","header":286331153,"fields":[{"name":"paused","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"RequestWalletPause","header":572662306,"fields":[{"name":"user","type":{"kind":"simple","type":"address","optional":false}},{"name":"paused","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"Pause","header":268435457,"fields":[]},
    {"name":"Unpause","header":268435458,"fields":[]},
    {"name":"SetGuardian","header":268435459,"fields":[{"name":"address","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"SetTreasury","header":268435460,"fields":[{"name":"address","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"SetFee","header":268435461,"fields":[{"name":"bps","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"NeoJettonMinter$Data","header":null,"fields":[{"name":"total_supply","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"content","type":{"kind":"simple","type":"cell","optional":false}},{"name":"max_supply","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"mint_price","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"mint_amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"public_mint_enabled","type":{"kind":"simple","type":"bool","optional":false}},{"name":"bridge_minter","type":{"kind":"simple","type":"address","optional":true}},{"name":"paused","type":{"kind":"simple","type":"bool","optional":false}},{"name":"guardian","type":{"kind":"simple","type":"address","optional":false}},{"name":"treasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"fee_bps","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"minters","type":{"kind":"dict","key":"address","value":"bool"}}]},
    {"name":"JettonData","header":null,"fields":[{"name":"total_supply","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"mintable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"admin_address","type":{"kind":"simple","type":"address","optional":false}},{"name":"content","type":{"kind":"simple","type":"cell","optional":false}},{"name":"wallet_code","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"NeoJettonWallet$Data","header":null,"fields":[{"name":"balance","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"master","type":{"kind":"simple","type":"address","optional":false}},{"name":"paused","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"WalletData","header":null,"fields":[{"name":"balance","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"master","type":{"kind":"simple","type":"address","optional":false}},{"name":"paused","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"NeoJettonFactory$Data","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"treasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"guardian","type":{"kind":"simple","type":"address","optional":false}},{"name":"paused","type":{"kind":"simple","type":"bool","optional":false}},{"name":"fee_bps","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
]

const NeoJettonMinter_opcodes = {
    "ChangeOwner": 2174598809,
    "ChangeOwnerOk": 846932810,
    "Deploy": 2490013878,
    "DeployOk": 2952335191,
    "FactoryDeploy": 1829761339,
    "Transfer": 1963556701,
    "InternalTransfer": 85167505,
    "TransferNotification": 1935855772,
    "Burn": 1499400124,
    "BurnNotification": 2078119902,
    "Excesses": 3576854235,
    "DeployJetton": 1640691497,
    "SetPublicMint": 305419896,
    "SetBridgeMinter": 2271560481,
    "BridgeMint": 1964052753,
    "SetWalletPause": 286331153,
    "RequestWalletPause": 572662306,
    "Pause": 268435457,
    "Unpause": 268435458,
    "SetGuardian": 268435459,
    "SetTreasury": 268435460,
    "SetFee": 268435461,
}

const NeoJettonMinter_getters: ABIGetter[] = [
    {"name":"get_jetton_data","methodId":106029,"arguments":[],"returnType":{"kind":"simple","type":"JettonData","optional":false}},
    {"name":"get_wallet_address","methodId":103289,"arguments":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}}],"returnType":{"kind":"simple","type":"address","optional":false}},
    {"name":"is_paused","methodId":95098,"arguments":[],"returnType":{"kind":"simple","type":"bool","optional":false}},
    {"name":"owner","methodId":83229,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
]

export const NeoJettonMinter_getterMapping: { [key: string]: string } = {
    'get_jetton_data': 'getGetJettonData',
    'get_wallet_address': 'getGetWalletAddress',
    'is_paused': 'getIsPaused',
    'owner': 'getOwner',
}

const NeoJettonMinter_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"text","text":"public_mint"}},
    {"receiver":"internal","message":{"kind":"typed","type":"BurnNotification"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Pause"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Unpause"}},
    {"receiver":"internal","message":{"kind":"typed","type":"SetGuardian"}},
    {"receiver":"internal","message":{"kind":"typed","type":"SetTreasury"}},
    {"receiver":"internal","message":{"kind":"typed","type":"SetPublicMint"}},
    {"receiver":"internal","message":{"kind":"typed","type":"RequestWalletPause"}},
    {"receiver":"internal","message":{"kind":"typed","type":"SetBridgeMinter"}},
    {"receiver":"internal","message":{"kind":"typed","type":"BridgeMint"}},
    {"receiver":"internal","message":{"kind":"text","text":"withdraw"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Deploy"}},
]

export const PROTOCOL_FEE_BPS = 500n;
export const MIN_RESERVE = 50000000n;
export const PROTOCOL_TREASURY = address("EQBSi9T1-iPqrVvs8dDFIlOxQ7qZYTYFT4ocF7wK1syBeqSm");
export const ERROR_INSUFFICIENT_FUNDS = 1000n;
export const ERROR_NOT_OWNER = 1001n;
export const ERROR_MAX_SUPPLY_REACHED = 1002n;
export const ERROR_MINT_DISABLED = 1003n;
export const ERROR_ALREADY_MINTED = 1004n;

export class NeoJettonMinter implements Contract {
    
    public static readonly storageReserve = 0n;
    public static readonly errors = NeoJettonMinter_errors_backward;
    public static readonly opcodes = NeoJettonMinter_opcodes;
    
    static async init(owner: Address, content: Cell, max: bigint, price: bigint, amount: bigint, treasury: Address) {
        return await NeoJettonMinter_init(owner, content, max, price, amount, treasury);
    }
    
    static async fromInit(owner: Address, content: Cell, max: bigint, price: bigint, amount: bigint, treasury: Address) {
        const __gen_init = await NeoJettonMinter_init(owner, content, max, price, amount, treasury);
        const address = contractAddress(0, __gen_init);
        return new NeoJettonMinter(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new NeoJettonMinter(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  NeoJettonMinter_types,
        getters: NeoJettonMinter_getters,
        receivers: NeoJettonMinter_receivers,
        errors: NeoJettonMinter_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: "public_mint" | BurnNotification | Pause | Unpause | SetGuardian | SetTreasury | SetPublicMint | RequestWalletPause | SetBridgeMinter | BridgeMint | "withdraw" | Deploy) {
        
        let body: Cell | null = null;
        if (message === "public_mint") {
            body = beginCell().storeUint(0, 32).storeStringTail(message).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'BurnNotification') {
            body = beginCell().store(storeBurnNotification(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Pause') {
            body = beginCell().store(storePause(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Unpause') {
            body = beginCell().store(storeUnpause(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'SetGuardian') {
            body = beginCell().store(storeSetGuardian(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'SetTreasury') {
            body = beginCell().store(storeSetTreasury(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'SetPublicMint') {
            body = beginCell().store(storeSetPublicMint(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'RequestWalletPause') {
            body = beginCell().store(storeRequestWalletPause(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'SetBridgeMinter') {
            body = beginCell().store(storeSetBridgeMinter(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'BridgeMint') {
            body = beginCell().store(storeBridgeMint(message)).endCell();
        }
        if (message === "withdraw") {
            body = beginCell().storeUint(0, 32).storeStringTail(message).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Deploy') {
            body = beginCell().store(storeDeploy(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getGetJettonData(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('get_jetton_data', builder.build())).stack;
        const result = loadGetterTupleJettonData(source);
        return result;
    }
    
    async getGetWalletAddress(provider: ContractProvider, owner: Address) {
        const builder = new TupleBuilder();
        builder.writeAddress(owner);
        const source = (await provider.get('get_wallet_address', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
    async getIsPaused(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('is_paused', builder.build())).stack;
        const result = source.readBoolean();
        return result;
    }
    
    async getOwner(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('owner', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
}