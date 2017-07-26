var Token = artifacts.require("./UnitFundToken.sol");
var TestToken = artifacts.require("./TestUnitFundToken.sol");

var BigNumber = require('bignumber.js');

var gasToUse = 4712388;

var ethersReceiver = "0xed8e0f84c60587a4f38c2fec3ede1eb02fe0a1e0";

contract('UnitFundToken', function(accounts) {
    it("should put 50000000 UFT in own smart contract account", function() {
        var instance;
        
        return Token.new().then(function(_instance) {
            instance = _instance;

            return instance.balanceOf.call(instance.address);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), new BigNumber(web3.toWei("50000000", "ether")).valueOf(), "50000000 wasn't in the own smart contract account");

            return instance.balanceOf.call(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "0", "0 wasn't in the first account");
        });
    });

    //@TODO: test bonus calculation
    it("bonus calculation", function() {
        var instance;

        return Token.deployed().then(function(_instance) {
            instance = _instance;

            return instance.getBonus.call(0, web3.toWei(2500, "ether"));
        }).then(function(bonus) {
            assert.equal(bonus.valueOf(), new BigNumber(web3.toWei("625", "ether")).valueOf(), "bonus not equals to 625 ethers");

            return instance.getBonus.call(0, web3.toWei(2510, "ether"));
        }).then(function(bonus) {
            assert.equal(bonus.valueOf(), new BigNumber(web3.toWei("627", "ether")).valueOf(), "bonus not equals to 627 ethers");

            return instance.getBonus.call(web3.toWei(2500, "ether"), web3.toWei(1000, "ether"));
        }).then(function(bonus) {
            assert.equal(bonus.valueOf(), new BigNumber(web3.toWei("200", "ether")).valueOf(), "bonus not equals to 200 ethers");

            return instance.getBonus.call(web3.toWei(2900, "ether"), web3.toWei(5000, "ether"));
        }).then(function(bonus) {
            assert.equal(bonus.valueOf(), new BigNumber(web3.toWei("835", "ether")).valueOf(), "bonus not equals to 835 tokens");

            return instance.getBonus.call(web3.toWei(13000, "ether"), web3.toWei(5000, "ether"));
        }).then(function(bonus) {
            assert.equal(bonus.valueOf(), new BigNumber(web3.toWei("0", "ether")).valueOf(), "bonus not equals to 0 ethers");

            return instance.getBonus.call(web3.toWei(10350, "ether"), web3.toWei(2320, "ether"));
        }).then(function(bonus) {
            assert.equal(bonus.valueOf(), new BigNumber("107500000000000000000").valueOf(), "bonus not equals to 107.5 ethers");
        });
    });

    //@TODO: test before ico purchase, after ico purchase
    it("should not be able to by tokens before ico start & after ico finish", function() {
        var instance;

        var icoSince = (new Date().getTime() + 86400 * 1000) / 1000;
        var icoTill = (icoSince + 86400);

        return Token.new(icoSince, icoTill, 10000000000).then(function(_instance) {
            instance = _instance;

            return instance.buy({from: accounts[0], value: 1});
        }).then(function(result) {
            assert(result.valueOf() !== true, "operation succeed - failing");
            assert.equal(result.receipt.gasUsed, gasToUse, "should have used all the gas");
        }).catch(function(err) {
            if (err.name == "AssertionError") {
                throw err;
            }

            return Token.new(icoSince - 10 * 3600, icoTill - 8 * 3600, 10000000000)
        }).then(function(_instance) {
            instance = _instance;

            return instance.buy({from: accounts[0], value: 1});
        }).then(function(result) {
            assert(result.valueOf() !== true, "operation succeed - failing");
            assert.equal(result.receipt.gasUsed, gasToUse, "should have used all the gas");
        }).catch(function(err) {
            if(err.name == "AssertionError") {
                throw err;
            }
        });
    });

    //@TODO: test ico purchase
    it("should be able to by tokens between ico start & ico finish", function() {
        var instance;

        var icoSince = (new Date().getTime() - 86400 * 1000) / 1000;
        var icoTill = (icoSince + 3 * 86400);

        return Token.new(icoSince, icoTill, 10000000000).then(function(_instance) {
            instance = _instance;

            return instance.buy({from: accounts[0], value: 1000});
        }).then(function(receipt) {
            assert(receipt.valueOf() !== true, "purchase failed");
            
            return instance.balanceOf.call(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "256250", "256250 wasn't in the accounts[0] account");

            return instance.balanceEthersOf.call(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "1000", "1000 wasn't in the accounts[0] account");

            return instance.collectedEthers.call();
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "1000", "1000 wasn't in collectedEthers");

            return instance.buy({from: accounts[1], value: 100000000});
        }).then(function(receipt) {
            assert(receipt.valueOf() !== true, "purchase failed");

            return instance.balanceOf.call(accounts[1]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "25625000000", "25625000000 wasn't in the accounts[1] account");

            return instance.balanceEthersOf.call(accounts[1]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "100000000", "100000000 wasn't in the accounts[1] account");

            return instance.collectedEthers.call();
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "100001000", "100001000 wasn't in collectedEthers");

            return instance.buy({from: accounts[0], value: 1});
        }).then(function(receipt) {
            assert(receipt.valueOf() !== true, "purchase failed");

            return instance.balanceOf.call(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "256455", "256455 wasn't in the accounts[0] account");

            return instance.balanceEthersOf.call(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "1001", "1001 wasn't in the accounts[0] account");

            return instance.collectedEthers.call();
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "100001001", "100001001 wasn't in collectedEthers");
        });
    });

    //@TODO: test failed ico, refund functionality
    it("should be able to buy tokens, ico failed because of not enough amount", function() {
        var instance;

        var icoSince = (new Date().getTime() - 86400 * 1000) / 1000;
        var icoTill = (icoSince + 86400);

        var icoSince = (new Date().getTime() - 86400 * 1000) / 1000;
        var icoTill = (icoSince + 3 * 86400);

        return TestToken.new(icoSince, icoTill, 10000000000).then(function(_instance) {
            instance = _instance;

            return instance.buy({from: accounts[0], value: 1000});
        }).then(function(receipt) {
            assert(receipt.valueOf() !== true, "purchase failed");

            return instance.balanceOf.call(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "256250", "256250 wasn't in the accounts[0] account");

            return instance.balanceEthersOf.call(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "1000", "1000 wasn't in the accounts[0] account");

            return instance.collectedEthers.call();
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "1000", "1000 wasn't in collectedEthers");

            return instance.goalReached.call(icoSince - 10);
        }).then(function(status) {
            assert.equal(status.valueOf(), false, "goal reached succeed before ico - failing");

            return instance.locked.call();
        }).then(function(locked) {
            assert.equal(locked.valueOf(), true, "contract is unlocked - failing");

            return instance.icoSucceed.call();
        }).then(function(icoSucceed) {
            assert.equal(icoSucceed.valueOf(), false, "icoSucceed true - failing");

            return instance.goalReached.call(icoSince + 10);
        }).then(function(status) {
            assert.equal(status.valueOf(), false, "goal reached succeed during ico - failing");

            return instance.locked.call();
        }).then(function(locked) {
            assert.equal(locked.valueOf(), true, "contract is unlocked - failing");

            return instance.icoSucceed.call();
        }).then(function(icoSucceed) {
            assert.equal(icoSucceed.valueOf(), false, "icoSucceed true - failing");

            return instance.goalReached.call(icoTill + 10);
        }).then(function(status) {
            assert.equal(status.valueOf(), false, "goal reached succeed after ico with not enough ethers collected - failing");

            return instance.goalReached(icoTill + 10);
        }).then(function(status) {
            return instance.locked.call();
        }).then(function(locked) {
            assert.equal(locked.valueOf(), true, "contract is unlocked - failing");

            return instance.icoSucceed.call();
        }).then(function(icoSucceed) {
            assert.equal(icoSucceed.valueOf(), false, "icoSucceed true - failing");

            return instance.refund.call(icoSince - 1, {from: accounts[0]});
        }).then(function(status) {
            assert.equal(status.valueOf(), false, "refund succeed before ico - failing");

            return instance.refund.call(icoSince + 1, {from: accounts[0]});
        })
            .then(function(status) {
            assert.equal(status.valueOf(), false, "refund succeed during ico - failing");

            return instance.refund.call(icoTill + 1, {from: accounts[0]});
        }).then(function(status) {
            assert.equal(status.valueOf(), true, "refund failed after ico - failing");

            return instance.balanceOf.call(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "256250", "256250 wasn't in the accounts[0] account");

            return instance.balanceEthersOf.call(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "1000", "1000 wasn't in the accounts[0] account");

            return instance.transferEther.call(accounts[0], {from: accounts[0]})
        }).then(function(status) {
            assert.equal(status.valueOf(), false, "transfer ethers succeed - failing");

            return instance.refund(icoTill + 1, {from: accounts[0]});
        }).then(function(status) {
            return instance.balanceOf.call(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "0", "0 wasn't in the accounts[0] account after successful refund");

            return instance.balanceEthersOf.call(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "0", "0 wasn't in the accounts[0] account after successful refund");
        });
    });
    
    //@TODO: test successfull ico
    it("should be able to buy tokens, ico succeed because of collected enough amount", function() {
        var instance;

        var beforeEthereumsOnReceiver = web3.eth.getBalance(ethersReceiver);

        var icoSince = (new Date().getTime() - 86400 * 1000) / 1000;
        var icoTill = (icoSince + 3 * 86400);

        return TestToken.new(icoSince, icoTill, 10000000000).then(function(_instance) {
            instance = _instance;
            
            return instance.send(10000000000, {from: accounts[0]});
        }).then(function(receipt) {
            assert(receipt.valueOf() !== true, "purchase failed");

            return instance.balanceOf.call(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "2562500000000", "2562500000000 wasn't in the accounts[0] account");

            return instance.balanceEthersOf.call(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "10000000000", "10000000000 wasn't in the accounts[0] account");

            return instance.collectedEthers.call();
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "10000000000", "10000000000 wasn't in collectedEthers");

            return instance.goalReached.call(icoSince - 10);
        }).then(function(status) {
            assert.equal(status.valueOf(), false, "goal reached succeed before ico - failing");

            return instance.locked.call();
        }).then(function(locked) {
            assert.equal(locked.valueOf(), true, "contract is unlocked - failing");

            return instance.icoSucceed.call();
        }).then(function(icoSucceed) {
            assert.equal(icoSucceed.valueOf(), false, "contract is unlocked - failing");

            return instance.goalReached.call(icoSince + 10);
        }).then(function(status) {
            assert.equal(status.valueOf(), false, "goal reached succeed during ico - failing");

            return instance.locked.call();
        }).then(function(locked) {
            assert.equal(locked.valueOf(), true, "contract is unlocked - failing");

            return instance.icoSucceed.call();
        }).then(function(icoSucceed) {
            assert.equal(icoSucceed.valueOf(), false, "icoSucceed true - failing");

            return instance.goalReached.call(icoTill + 10);
        }).then(function(status) {
            assert.equal(status.valueOf(), true, "goal reached failed after ico with enough ethers collected - failing");

            return instance.goalReached(icoTill + 10);
        }).then(function() {
            return instance.locked.call();
        }).then(function(locked) {
            assert.equal(locked.valueOf(), false, "contract is unlocked - failing");

            return instance.icoSucceed.call();
        }).then(function(icoSucceed) {
            assert.equal(icoSucceed.valueOf(), true, "icoSucceed false - failing");

            return instance.refund.call(icoSince - 1, {from: accounts[0]});
        }).then(function(status) {
            assert.equal(status.valueOf(), false, "refund succeed before ico - failing");

            return instance.refund.call(icoSince + 1, {from: accounts[0]});
        })
        .then(function(status) {
            assert.equal(status.valueOf(), false, "refund succeed during ico - failing");

            return instance.refund.call(icoTill + 1, {from: accounts[0]});
        }).then(function(status) {
            assert.equal(status.valueOf(), false, "refund succeed after successful ico - failing");

            return instance.balanceOf.call(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "2562500000000", "2562500000000 wasn't in the accounts[0] account");

            return instance.balanceEthersOf.call(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "10000000000", "10000000000 wasn't in the accounts[0] account");

            return instance.transferEther(ethersReceiver);
        }).then(function() {
            assert.equal(web3.eth.getBalance(ethersReceiver).sub(beforeEthereumsOnReceiver).valueOf(), "10000000000", "10000000000 wasn't in the eth receiver");
            assert.equal(web3.eth.getBalance(instance.address).valueOf(), "0", "0 wasn't in smart contract");

            return instance.transfer(accounts[2], 1000, {from: accounts[0]})
        }).then(function() {
            return instance.balanceOf.call(accounts[2]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "1000", "1000 wasn't in accounts[2]");

            return instance.balanceOf.call(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), "2562499999000", "2562499999000 wasn't in accounts[0]");
        });
    });
});