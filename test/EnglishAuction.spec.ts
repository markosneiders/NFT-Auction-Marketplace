import chai, { expect } from "chai"
import bnChai from "chai-bn"
import cap from "chai-as-promised"
import BN from "bn.js"
const vuilder = require("@vite/vuilder")
import config from "./vite.config.json"
import * as vite from "@vite/vuilder/lib/vite"
import { Contract } from "@vite/vuilder/lib/contract"
import { UserAccount } from "@vite/vuilder/lib/user"
import { Address } from "cluster"

chai.use(bnChai(BN))
chai.use(cap)
const should = chai.should()

console.log("---------------------------------------------------------- Deploying...")

describe("test EnglishAuction", () => {
  let provider: any
  let deployer: any
  let buyer1: UserAccount, buyer2: UserAccount, buyer3: UserAccount, buyer4: any

  let englishAuction: Contract
  let ERC721: any

  let nft: string
  let nftId: string = "0"

  let blankAddress: string = "vite_0000000000000000000000000000000000000000a4f3a0cb58"

  async function deployEnglishAuction(_nftId: string, _startingBid: string) {
    // compile
    const compiledEnglishAuction = await vuilder.compile("EnglishAuction.solpp")
    expect(compiledEnglishAuction).to.have.property("EnglishAuction")

    // deploy
    englishAuction = compiledEnglishAuction.EnglishAuction
    englishAuction.setDeployer(deployer).setProvider(provider)
    await englishAuction.deploy({ responseLatency: 1, params: [nft, _nftId, _startingBid] })
    expect(englishAuction.address).to.be.a("string")
    console.log(englishAuction.address)
    return englishAuction
  }

  before(async function () {
    //Deployer and provider definitions
    provider = vuilder.newProvider(config.networks.local.http)
    deployer = vuilder.newAccount(config.networks.local.mnemonic, 0, provider)
    buyer1 = vite.newAccount(config.networks.local.mnemonic, 1, provider)
    buyer2 = vite.newAccount(config.networks.local.mnemonic, 2, provider)
    buyer3 = vite.newAccount(config.networks.local.mnemonic, 3, provider)
    buyer4 = vite.newAccount(config.networks.local.mnemonic, 4, provider)

    //Compile and deploy ERC721 for testing pourposes
    const compiledERC721 = await vuilder.compile("ERC721.solpp")
    expect(compiledERC721).to.have.property("ERC721")

    ERC721 = compiledERC721.ERC721
    ERC721.setDeployer(deployer).setProvider(provider)
    await ERC721.deploy({ responseLatency: 1 })
    expect(ERC721.address).to.be.a("string")
    console.log(ERC721.address)

    nft = ERC721.address
  })

  it("Contract initialization values are correct", async () => {
    //deploy
    nftId = String(Number(nftId) + 1)
    let startingBid = "1"
    englishAuction = await deployEnglishAuction(nftId, startingBid)

    await englishAuction.query("bids", [blankAddress]).should.eventually.deep.equal(["0"])
    await englishAuction.query("endAt", []).should.eventually.deep.equal(["0"])
    await englishAuction.query("ended", []).should.eventually.deep.equal(["0"])
    await englishAuction.query("highestBid", []).should.eventually.deep.equal([startingBid])
    await englishAuction.query("highestBidder", []).should.eventually.deep.equal([blankAddress])
    await englishAuction.query("nft", []).should.eventually.deep.equal([nft])
    await englishAuction.query("nftId", []).should.eventually.deep.equal([nftId])
    await englishAuction.query("seller", []).should.eventually.deep.equal([deployer.address])
    await englishAuction.query("started", []).should.eventually.deep.equal(["0"])
  })

  it("Start function works", async () => {
    //deploy
    nftId = String(Number(nftId) + 1)
    let startingBid = "1"
    englishAuction = await deployEnglishAuction(nftId, startingBid)

    //create NFT for deployer to sell
    await ERC721.call("mint", [deployer.address, nftId], { caller: deployer })
    await ERC721.call("approve", [englishAuction.address, nftId], { caller: deployer })

    //Verify NFT owenership and approval
    await ERC721.query("ownerOf", [nftId]).should.eventually.deep.equal([deployer.address])
    await ERC721.query("getApproved", [nftId]).should.eventually.deep.equal([englishAuction.address])

    //Start auction
    await englishAuction.call("start", [], { caller: deployer })

    //Verify contract values
    await englishAuction.query("bids", [blankAddress]).should.eventually.deep.equal(["0"])
    await englishAuction.query("endAt", []).should.not.eventually.deep.equal(["0"])
    await englishAuction.query("ended", []).should.eventually.deep.equal(["0"])
    await englishAuction.query("highestBid", []).should.eventually.deep.equal([startingBid])
    await englishAuction.query("highestBidder", []).should.eventually.deep.equal([blankAddress])
    await englishAuction.query("nft", []).should.eventually.deep.equal([nft])
    await englishAuction.query("nftId", []).should.eventually.deep.equal([nftId])
    await englishAuction.query("seller", []).should.eventually.deep.equal([deployer.address])
    await englishAuction.query("started", []).should.eventually.deep.equal(["1"])

    //Verify NFT ownership
    await ERC721.query("ownerOf", [nftId]).should.eventually.deep.equal([englishAuction.address])
    // await ERC721.query("getApproved", [nftId]).should.eventually.deep.equal([blankAddress])
  })
})
