const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IgnitionToken", function () {
  let token;
  let owner;
  let user1;
  let user2;
  
  const TOKEN_NAME = "Test Token";
  const TOKEN_SYMBOL = "TEST";
  const TOKEN_PRICE = ethers.parseEther("0.05");
  const TOKEN_SUPPLY = ethers.parseEther("1000");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("IgnitionToken");
    token = await Token.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      TOKEN_PRICE,
      TOKEN_SUPPLY
    );
    await token.waitForDeployment();
  });

  describe("Deploy", function () {
    it("Deve fazer deploy com parâmetros corretos", async function () {
      expect(await token.name()).to.equal(TOKEN_NAME);
      expect(await token.symbol()).to.equal(TOKEN_SYMBOL);
      expect(await token.PRICE()).to.equal(TOKEN_PRICE);
      expect(await token.INITIAL_SUPPLY()).to.equal(TOKEN_SUPPLY);
    });

    it("Deve ter mint habilitado por padrão", async function () {
      expect(await token.mintEnabled()).to.be.true;
    });
  });

  describe("Mint", function () {
    it("Deve permitir mint com preço correto", async function () {
      await expect(
        token.connect(user1).mint({ value: TOKEN_PRICE })
      )
        .to.emit(token, "Minted")
        .withArgs(user1.address, TOKEN_SUPPLY);

      expect(await token.balanceOf(user1.address)).to.equal(TOKEN_SUPPLY);
      expect(await token.hasMinted(user1.address)).to.be.true;
    });

    it("Deve rejeitar mint com preço incorreto", async function () {
      await expect(
        token.connect(user1).mint({ value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("Incorrect price");
    });

    it("Deve rejeitar mint duplicado", async function () {
      await token.connect(user1).mint({ value: TOKEN_PRICE });
      
      await expect(
        token.connect(user1).mint({ value: TOKEN_PRICE })
      ).to.be.revertedWith("Already minted");
    });

    it("Deve permitir múltiplos usuários mintarem", async function () {
      await token.connect(user1).mint({ value: TOKEN_PRICE });
      await token.connect(user2).mint({ value: TOKEN_PRICE });

      expect(await token.balanceOf(user1.address)).to.equal(TOKEN_SUPPLY);
      expect(await token.balanceOf(user2.address)).to.equal(TOKEN_SUPPLY);
    });
  });

  describe("Mint Control", function () {
    it("Deve permitir owner desabilitar mint", async function () {
      await token.disableMint();
      expect(await token.mintEnabled()).to.be.false;

      await expect(
        token.connect(user1).mint({ value: TOKEN_PRICE })
      ).to.be.revertedWith("Mint disabled");
    });

    it("Deve permitir owner habilitar mint novamente", async function () {
      await token.disableMint();
      await token.enableMint();
      expect(await token.mintEnabled()).to.be.true;

      await expect(
        token.connect(user1).mint({ value: TOKEN_PRICE })
      ).to.not.be.reverted;
    });
  });

  describe("Withdraw", function () {
    it("Deve permitir owner retirar fundos", async function () {
      await token.connect(user1).mint({ value: TOKEN_PRICE });
      
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      const tx = await token.withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(owner.address);

      expect(balanceAfter).to.be.gt(balanceBefore - gasUsed);
    });
  });
});

