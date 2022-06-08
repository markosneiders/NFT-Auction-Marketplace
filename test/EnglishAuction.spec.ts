import chai, { expect } from "chai"
import bnChai from "chai-bn"
import cap from "chai-as-promised"
import BN from "bn.js"
const vuilder = require("@vite/vuilder")
import config from "./vite.config.json"
import * as vite from "@vite/vuilder/lib/vite"
import { Contract } from "@vite/vuilder/lib/contract"
import { UserAccount } from "@vite/vuilder/lib/user"

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
  let nftId: string
  let startingBid: string

  before(async function () {
    //Deployer and provider definitions
    provider = vuilder.newProvider(config.networks.local.http)
    deployer = vuilder.newAccount(config.networks.local.mnemonic, 0, provider)
    buyer1 = vite.newAccount(config.networks.local.mnemonic, 1, provider)
    buyer2 = vite.newAccount(config.networks.local.mnemonic, 2, provider)
    buyer3 = vite.newAccount(config.networks.local.mnemonic, 3, provider)
    buyer4 = vite.newAccount(config.networks.local.mnemonic, 4, provider)
    //Deploy ERC721

    // compile
    const compiledERC721 = await vuilder.compile("ERC721.solpp")
    expect(compiledERC721).to.have.property("ERC721")

    // deploy
    ERC721 = compiledERC721.ERC721
    ERC721.setDeployer(deployer).setProvider(provider)
    await ERC721.deploy({ responseLatency: 1 })
    expect(ERC721.address).to.be.a("string")
    console.log(ERC721.address)

    nft = ERC721.address
    nftId = "77"
  })
  beforeEach(async function () {
    // compile
    const compiledEnglishAuction = await vuilder.compile("EnglishAuction.solpp")
    expect(compiledEnglishAuction).to.have.property("EnglishAuction")

    startingBid = "1"

    // deploy
    englishAuction = compiledEnglishAuction.EnglishAuction
    englishAuction.setDeployer(deployer).setProvider(provider)
    await englishAuction.deploy({
      responseLatency: 1,
      params: [nft, nftId, startingBid],
    })
    expect(englishAuction.address).to.be.a("string")
    console.log(englishAuction.address)
  })

  it("Contract initialization values are correct", async () => {
    await englishAuction.query("bids", ["vite_0000000000000000000000000000000000000000a4f3a0cb58"]).should.eventually.deep.equal(["0"])
    await englishAuction.query("endAt", []).should.eventually.deep.equal(["0"])
    await englishAuction.query("ended", []).should.eventually.deep.equal(["0"])
    await englishAuction.query("highestBid", []).should.eventually.deep.equal([startingBid])
    await englishAuction.query("highestBidder", []).should.eventually.deep.equal(["vite_0000000000000000000000000000000000000000a4f3a0cb58"])
    await englishAuction.query("nft", []).should.eventually.deep.equal([nft])
    await englishAuction.query("nftId", []).should.eventually.deep.equal([nftId])
    await englishAuction.query("seller", []).should.eventually.deep.equal([deployer.address])
    await englishAuction.query("started", []).should.eventually.deep.equal(["0"])
  })

  it("Start function works", async () => {
    //create NFT for deployer to sell
    await ERC721.call("mint", [deployer.address, nftId], { caller: deployer })
    console.log(await ERC721.query("ownerOf", [nftId]))
  })
})
