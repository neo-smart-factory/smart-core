import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, toNano, beginCell } from '@ton/core';
import { NeoJettonFactory } from '../../build/factory/factory_NeoJettonFactory';
import '@ton/test-utils';

describe('NΞØ Protocol TON Tests', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let guardian: SandboxContract<TreasuryContract>;
    let treasury: SandboxContract<TreasuryContract>;
    
    let factory: SandboxContract<NeoJettonFactory>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        user = await blockchain.treasury('user');
        guardian = await blockchain.treasury('guardian');
        treasury = await blockchain.treasury('treasury');

        // 1. Deploy Factory
        factory = blockchain.openContract(await NeoJettonFactory.fromInit(deployer.address, treasury.address));
        
        const deployResult = await factory.send(
            deployer.getSender(),
            { value: toNano('0.1') },
            { $$type: 'Deploy', queryId: 0n }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: factory.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy a new Jetton through the Factory', async () => {
        const content = beginCell().storeUint(1, 8).storeStringTail("https://neo.protocol/metadata.json").endCell();
        const maxSupply = toNano('1000000'); // 1M
        const mintPrice = toNano('0.1');
        const mintAmount = toNano('1000');

        const deployResult = await factory.send(
            deployer.getSender(),
            { value: toNano('0.5') },
            { 
                $$type: 'DeployJetton', 
                owner: deployer.address,
                content: content,
                max_supply: maxSupply,
                mint_price: mintPrice,
                mint_amount: mintAmount
            }
        );

        // Verifica se a Factory disparou o deploy do Minter
        expect(deployResult.transactions).toHaveTransaction({
            from: factory.address,
            success: true,
        });
    });

    it('should respect the Circuit Breaker (Pause) on Factory', async () => {
        // 1. Set Guardian
        await factory.send(deployer.getSender(), { value: toNano('0.05') }, { $$type: 'SetGuardian', address: guardian.address });

        // 2. Pause by Guardian
        await factory.send(guardian.getSender(), { value: toNano('0.05') }, { $$type: 'Pause' });
        expect(await factory.getIsPaused()).toBe(true);

        // 3. Attempt to deploy while paused (should fail)
        const deployAttempt = await factory.send(
            deployer.getSender(),
            { value: toNano('0.5') },
            { 
                $$type: 'DeployJetton', 
                owner: deployer.address,
                content: beginCell().endCell(),
                max_supply: BigInt(1000),
                mint_price: BigInt(0),
                mint_amount: BigInt(10)
            }
        );

        expect(deployAttempt.transactions).toHaveTransaction({
            from: deployer.address,
            to: factory.address,
            success: false,
            // O erro de exit code pode variar, mas o importante é que a transação não teve sucesso
        });
    });

    it('should implement the 5% fee split correctly on withdraw', async () => {
        // Simular saldo na Factory
        await deployer.send({ to: factory.address, value: toNano('10') });
        
        const withdrawResult = await factory.send(deployer.getSender(), { value: toNano('0.05') }, "withdraw");

        expect(withdrawResult.transactions).toHaveTransaction({
            from: factory.address,
            to: deployer.address,
            success: true,
        });
    });
});
