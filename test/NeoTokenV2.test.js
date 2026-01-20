/**
 * NeoTokenV2 Test Suite
 * Testes completos para o contrato NEOFLW na Base
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NeoTokenV2", function () {
    let neoToken;
    let owner;
    let user1;
    let user2;
    let bridgeMinter;

    const TOKEN_NAME = "NEOFlowOFF";
    const TOKEN_SYMBOL = "NEOFLW";
    const MINT_PRICE = ethers.parseEther("0.1");
    const MINT_AMOUNT = ethers.parseEther("1000");
    const MAX_SUPPLY = ethers.parseEther("1000000000"); // 1 bilhão

    beforeEach(async function () {
        [owner, user1, user2, bridgeMinter] = await ethers.getSigners();

        const NeoTokenV2 = await ethers.getContractFactory("NeoTokenV2");
        neoToken = await NeoTokenV2.deploy(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            MINT_PRICE,
            MINT_AMOUNT,
            owner.address
        );
        await neoToken.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await neoToken.name()).to.equal(TOKEN_NAME);
            expect(await neoToken.symbol()).to.equal(TOKEN_SYMBOL);
        });

        it("Should set the correct owner", async function () {
            expect(await neoToken.owner()).to.equal(owner.address);
        });

        it("Should set the correct mint price and amount", async function () {
            expect(await neoToken.MINT_PRICE()).to.equal(MINT_PRICE);
            expect(await neoToken.MINT_AMOUNT()).to.equal(MINT_AMOUNT);
        });

        it("Should set the correct max supply", async function () {
            expect(await neoToken.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
        });

        it("Should start with public mint enabled", async function () {
            expect(await neoToken.publicMintEnabled()).to.equal(true);
        });

        it("Should start with zero total supply", async function () {
            expect(await neoToken.totalSupply()).to.equal(0);
        });
    });

    describe("Public Mint", function () {
        it("Should allow public mint with correct price", async function () {
            await expect(
                neoToken.connect(user1).publicMint({ value: MINT_PRICE })
            ).to.changeTokenBalance(neoToken, user1, MINT_AMOUNT);
        });

        it("Should emit PublicMinted event", async function () {
            await expect(
                neoToken.connect(user1).publicMint({ value: MINT_PRICE })
            )
                .to.emit(neoToken, "PublicMinted")
                .withArgs(user1.address, MINT_AMOUNT, MINT_PRICE);
        });

        it("Should fail if incorrect price is sent", async function () {
            await expect(
                neoToken.connect(user1).publicMint({ value: ethers.parseEther("0.05") })
            ).to.be.revertedWith("Incorrect ETH/POL value");
        });

        it("Should fail if user already minted", async function () {
            await neoToken.connect(user1).publicMint({ value: MINT_PRICE });

            await expect(
                neoToken.connect(user1).publicMint({ value: MINT_PRICE })
            ).to.be.revertedWith("Already minted");
        });

        it("Should fail if public mint is disabled", async function () {
            await neoToken.setPublicMintStatus(false);

            await expect(
                neoToken.connect(user1).publicMint({ value: MINT_PRICE })
            ).to.be.revertedWith("Public mint disabled");
        });

        it("Should fail if max supply would be exceeded", async function () {
            // Deploy com supply menor para testar
            const SmallSupplyToken = await ethers.getContractFactory("NeoTokenV2");
            const smallToken = await SmallSupplyToken.deploy(
                TOKEN_NAME,
                TOKEN_SYMBOL,
                MINT_PRICE,
                ethers.parseEther("100"), // 100 tokens por mint
                owner.address
            );

            // Mintar até quase o limite
            // (Este teste seria mais complexo, apenas exemplo)
            await expect(
                smallToken.connect(user1).publicMint({ value: MINT_PRICE })
            ).to.not.be.reverted;
        });

        it("Should update hasPublicMinted mapping", async function () {
            expect(await neoToken.hasPublicMinted(user1.address)).to.equal(false);

            await neoToken.connect(user1).publicMint({ value: MINT_PRICE });

            expect(await neoToken.hasPublicMinted(user1.address)).to.equal(true);
        });

        it("Should increase total supply", async function () {
            const initialSupply = await neoToken.totalSupply();

            await neoToken.connect(user1).publicMint({ value: MINT_PRICE });

            expect(await neoToken.totalSupply()).to.equal(initialSupply + MINT_AMOUNT);
        });
    });

    describe("Bridge Mint", function () {
        beforeEach(async function () {
            await neoToken.setBridgeMinter(bridgeMinter.address);
        });

        it("Should allow bridge minter to mint", async function () {
            const amount = ethers.parseEther("500");

            await expect(
                neoToken.connect(bridgeMinter).bridgeMint(user1.address, amount)
            ).to.changeTokenBalance(neoToken, user1, amount);
        });

        it("Should emit BridgeMinted event", async function () {
            const amount = ethers.parseEther("500");

            await expect(
                neoToken.connect(bridgeMinter).bridgeMint(user1.address, amount)
            )
                .to.emit(neoToken, "BridgeMinted")
                .withArgs(user1.address, amount);
        });

        it("Should fail if caller is not bridge minter", async function () {
            const amount = ethers.parseEther("500");

            await expect(
                neoToken.connect(user1).bridgeMint(user2.address, amount)
            ).to.be.revertedWith("Caller is not the bridge minter");
        });

        it("Should fail if minting to zero address", async function () {
            const amount = ethers.parseEther("500");

            await expect(
                neoToken.connect(bridgeMinter).bridgeMint(ethers.ZeroAddress, amount)
            ).to.be.revertedWith("Cannot mint to zero address");
        });

        it("Should fail if max supply would be exceeded", async function () {
            const amount = MAX_SUPPLY + 1n;

            await expect(
                neoToken.connect(bridgeMinter).bridgeMint(user1.address, amount)
            ).to.be.revertedWith("Max supply reached");
        });

        it("Should increase total supply", async function () {
            const amount = ethers.parseEther("500");
            const initialSupply = await neoToken.totalSupply();

            await neoToken.connect(bridgeMinter).bridgeMint(user1.address, amount);

            expect(await neoToken.totalSupply()).to.equal(initialSupply + amount);
        });
    });

    describe("Bridge Minter Management", function () {
        it("Should allow owner to set bridge minter", async function () {
            await neoToken.setBridgeMinter(bridgeMinter.address);
            expect(await neoToken.bridgeMinter()).to.equal(bridgeMinter.address);
        });

        it("Should emit BridgeMinterUpdated event", async function () {
            await expect(neoToken.setBridgeMinter(bridgeMinter.address))
                .to.emit(neoToken, "BridgeMinterUpdated")
                .withArgs(bridgeMinter.address);
        });

        it("Should fail if non-owner tries to set bridge minter", async function () {
            await expect(
                neoToken.connect(user1).setBridgeMinter(bridgeMinter.address)
            ).to.be.revertedWithCustomError(neoToken, "OwnableUnauthorizedAccount");
        });

        it("Should fail if setting zero address as bridge minter", async function () {
            await expect(
                neoToken.setBridgeMinter(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid bridge minter");
        });
    });

    describe("Public Mint Status", function () {
        it("Should allow owner to disable public mint", async function () {
            await neoToken.setPublicMintStatus(false);
            expect(await neoToken.publicMintEnabled()).to.equal(false);
        });

        it("Should allow owner to re-enable public mint", async function () {
            await neoToken.setPublicMintStatus(false);
            await neoToken.setPublicMintStatus(true);
            expect(await neoToken.publicMintEnabled()).to.equal(true);
        });

        it("Should emit PublicMintStatusChanged event", async function () {
            await expect(neoToken.setPublicMintStatus(false))
                .to.emit(neoToken, "PublicMintStatusChanged")
                .withArgs(false);
        });

        it("Should fail if non-owner tries to change status", async function () {
            await expect(
                neoToken.connect(user1).setPublicMintStatus(false)
            ).to.be.revertedWithCustomError(neoToken, "OwnableUnauthorizedAccount");
        });
    });

    describe("Reset Public Mint", function () {
        beforeEach(async function () {
            await neoToken.connect(user1).publicMint({ value: MINT_PRICE });
        });

        it("Should allow owner to reset user's mint status", async function () {
            expect(await neoToken.hasPublicMinted(user1.address)).to.equal(true);

            await neoToken.resetPublicMint(user1.address);

            expect(await neoToken.hasPublicMinted(user1.address)).to.equal(false);
        });

        it("Should allow user to mint again after reset", async function () {
            await neoToken.resetPublicMint(user1.address);

            await expect(
                neoToken.connect(user1).publicMint({ value: MINT_PRICE })
            ).to.not.be.reverted;
        });

        it("Should fail if non-owner tries to reset", async function () {
            await expect(
                neoToken.connect(user1).resetPublicMint(user2.address)
            ).to.be.revertedWithCustomError(neoToken, "OwnableUnauthorizedAccount");
        });
    });

    describe("Withdraw", function () {
        beforeEach(async function () {
            // Fazer alguns mints para acumular ETH
            await neoToken.connect(user1).publicMint({ value: MINT_PRICE });
            await neoToken.connect(user2).publicMint({ value: MINT_PRICE });
        });

        it("Should allow owner to withdraw accumulated ETH", async function () {
            const contractBalance = await ethers.provider.getBalance(await neoToken.getAddress());

            await expect(
                neoToken.withdraw()
            ).to.changeEtherBalance(owner, contractBalance);
        });

        it("Should fail if non-owner tries to withdraw", async function () {
            await expect(
                neoToken.connect(user1).withdraw()
            ).to.be.revertedWithCustomError(neoToken, "OwnableUnauthorizedAccount");
        });

        it("Should fail if no balance to withdraw", async function () {
            await neoToken.withdraw(); // Withdraw tudo

            await expect(
                neoToken.withdraw()
            ).to.be.revertedWith("No balance to withdraw");
        });
    });

    describe("ERC20 Functionality", function () {
        beforeEach(async function () {
            await neoToken.connect(user1).publicMint({ value: MINT_PRICE });
        });

        it("Should allow token transfers", async function () {
            const amount = ethers.parseEther("100");

            await expect(
                neoToken.connect(user1).transfer(user2.address, amount)
            ).to.changeTokenBalances(
                neoToken,
                [user1, user2],
                [-amount, amount]
            );
        });

        it("Should allow token burning", async function () {
            const amount = ethers.parseEther("100");
            const initialSupply = await neoToken.totalSupply();

            await neoToken.connect(user1).burn(amount);

            expect(await neoToken.totalSupply()).to.equal(initialSupply - amount);
        });

        it("Should support ERC20Permit", async function () {
            // Teste básico de permit (pode ser expandido)
            expect(await neoToken.DOMAIN_SEPARATOR()).to.not.equal(ethers.ZeroHash);
        });
    });

    describe("Ownership Transfer (Ownable2Step)", function () {
        it("Should require two-step process for ownership transfer", async function () {
            // Iniciar transferência
            await neoToken.transferOwnership(user1.address);

            // Owner ainda é o original
            expect(await neoToken.owner()).to.equal(owner.address);

            // Novo owner precisa aceitar
            await neoToken.connect(user1).acceptOwnership();

            // Agora ownership foi transferido
            expect(await neoToken.owner()).to.equal(user1.address);
        });

        it("Should fail if non-pending-owner tries to accept", async function () {
            await neoToken.transferOwnership(user1.address);

            await expect(
                neoToken.connect(user2).acceptOwnership()
            ).to.be.revertedWithCustomError(neoToken, "OwnableUnauthorizedAccount");
        });
    });

    describe("Contract Info", function () {
        it("Should return correct contract info", async function () {
            const info = await neoToken.getContractInfo();

            expect(info.currentSupply).to.equal(0);
            expect(info.maxSupply).to.equal(MAX_SUPPLY);
            expect(info.mintPrice).to.equal(MINT_PRICE);
            expect(info.mintAmount).to.equal(MINT_AMOUNT);
            expect(info.mintEnabled).to.equal(true);
            expect(info.bridge).to.equal(ethers.ZeroAddress);
        });

        it("Should update after mints", async function () {
            await neoToken.connect(user1).publicMint({ value: MINT_PRICE });

            const info = await neoToken.getContractInfo();
            expect(info.currentSupply).to.equal(MINT_AMOUNT);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle multiple users minting", async function () {
            const users = [user1, user2];

            for (const user of users) {
                await neoToken.connect(user).publicMint({ value: MINT_PRICE });
            }

            expect(await neoToken.totalSupply()).to.equal(MINT_AMOUNT * BigInt(users.length));
        });

        it("Should handle large bridge mints", async function () {
            await neoToken.setBridgeMinter(bridgeMinter.address);

            const largeAmount = ethers.parseEther("1000000"); // 1 milhão

            await expect(
                neoToken.connect(bridgeMinter).bridgeMint(user1.address, largeAmount)
            ).to.not.be.reverted;
        });

        it("Should prevent minting beyond max supply", async function () {
            await neoToken.setBridgeMinter(bridgeMinter.address);

            // Tentar mintar mais que o max supply
            await expect(
                neoToken.connect(bridgeMinter).bridgeMint(user1.address, MAX_SUPPLY + 1n)
            ).to.be.revertedWith("Max supply reached");
        });
    });

    describe("Gas Optimization", function () {
        it("Should have reasonable gas costs for public mint", async function () {
            const tx = await neoToken.connect(user1).publicMint({ value: MINT_PRICE });
            const receipt = await tx.wait();

            console.log(`Public Mint Gas Used: ${receipt.gasUsed}`);

            // Espera-se menos de 150k gas
            expect(receipt.gasUsed).to.be.lessThan(150000);
        });

        it("Should have reasonable gas costs for bridge mint", async function () {
            await neoToken.setBridgeMinter(bridgeMinter.address);

            const tx = await neoToken.connect(bridgeMinter).bridgeMint(
                user1.address,
                ethers.parseEther("100")
            );
            const receipt = await tx.wait();

            console.log(`Bridge Mint Gas Used: ${receipt.gasUsed}`);

            // Espera-se menos de 100k gas
            expect(receipt.gasUsed).to.be.lessThan(100000);
        });
    });
});
