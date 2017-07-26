pragma solidity ^0.4.2;

contract owned {
    address public owner;

    function owned() {
        owner = msg.sender;
    }

    modifier onlyOwner {
        if (msg.sender != owner) throw;
        _;
    }

    function transferOwnership(address newOwner) onlyOwner {
        owner = newOwner;
    }
}

contract tokenRecipient {
    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData);
}

contract UnitFundToken is owned {
    string public standard = 'Unit.Fund 0.1';
    string public name = 'Unit.Fund';
    string public symbol = 'UFT';
    uint8 public decimals = 18;

    uint256 public totalSupply = 50000000 ether;

    uint256 public buyPrice = 205;

    uint256 public icoSince;  // 1501056000 = 07/26/2017 @ 8:00am (UTC)
    uint256 public icoTill;   // 1503734400 = 08/26/2017 @ 8:00am (UTC)
    uint256 public minEthersCollected;
    uint256 public collectedEthers;
    bool public locked;
    bool public icoSucceed;

    /* This creates an array with all balances */
    mapping (address => uint256) public balanceOf;
    mapping (address => uint256) public balanceEthersOf;
    mapping (address => mapping (address => uint256)) public allowance;

    /* This generates a public event on the blockchain that will notify clients */
    event Transfer(address indexed from, address indexed to, uint256 value);
    event BonusEarned(address indexed from, uint256 tokens);

    /* Initializes contract with initial supply tokens to the creator of the contract */
    function UnitFundToken(uint256 _icoSince, uint256 _icoTill, uint256 _minEthersCollected) {
        balanceOf[this] = totalSupply;              // Give the creator all initial tokens

        icoSince = _icoSince;
        icoTill = _icoTill;
        minEthersCollected = _minEthersCollected;
        locked = true;
    }

    /* Send coins */
    function transfer(address _to, uint256 _value) {
        if(locked) {
            throw;
        }

        if (balanceOf[msg.sender] < _value) throw;           // Check if the sender has enough
        if (balanceOf[_to] + _value < balanceOf[_to]) throw; // Check for overflows
        balanceOf[msg.sender] -= _value;                     // Subtract from the sender
        balanceOf[_to] += _value;                            // Add the same to the recipient
        Transfer(msg.sender, _to, _value);                   // Notify anyone listening that this transfer took place
    }

    /* A contract attempts to get the coins */
    function transferFrom(address _from, address _to, uint256 _value) returns (bool success) {
        if(locked) {
            return false;
        }

        if (balanceOf[_from] < _value) throw;                 // Check if the sender has enough
        if (balanceOf[_to] + _value < balanceOf[_to]) throw;  // Check for overflows
        if (_value > allowance[_from][msg.sender]) throw;   // Check allowance
        balanceOf[_from] -= _value;                          // Subtract from the sender
        balanceOf[_to] += _value;                            // Add the same to the recipient
        allowance[_from][msg.sender] -= _value;
        Transfer(_from, _to, _value);

        return true;
    }

    /* Allow another contract to spend some tokens in your behalf */
    function approve(address _spender, uint256 _value) returns (bool success) {
        if(locked) {
            return false;
        }

        allowance[msg.sender][_spender] = _value;

        return true;
    }

    /* Approve and then communicate the approved contract in a single tx */
    function approveAndCall(address _spender, uint256 _value, bytes _extraData) returns (bool success) {
        if(locked) {
            return false;
        }

        tokenRecipient spender = tokenRecipient(_spender);

        if (approve(_spender, _value)) {
            spender.receiveApproval(msg.sender, _value, this, _extraData);
            return true;
        }
    }

    function getBonus(uint256 _collectedEthers, uint256 txEthers) returns (uint256 bonus) {
        if(_collectedEthers > 12500 ether) {
            return 0;
        }

        /*
            0     - 2500  = 25%
            2500  - 5000  = 20%
            5000  - 7500  = 15%
            7500  - 10000 = 10%
            10000 - 12500 = 5%
        */

        uint256 _bonus = 0;
        uint256 ethersLeft = txEthers;
        uint256 newCollectedEthers = _collectedEthers;

        uint8 j;

        for(uint8 i = 5; i > 0; i--) {
            if(ethersLeft == 0) {
                break;
            }

            j = 5 - i;

            uint256 val = (j + 1);
            val *= 2500 ether;

            if(val < newCollectedEthers) {
                continue;
            }

            uint8 percentage = i * 5;

            if(ethersLeft > val - newCollectedEthers) {
                uint256 availableEthers = val - newCollectedEthers;

                _bonus += availableEthers / 100 * percentage;

                ethersLeft -= availableEthers;
                newCollectedEthers += availableEthers;
            }
            else {
                _bonus += ethersLeft / 100 * percentage;

                ethersLeft = 0;
            }
        }

        return _bonus;
    }

    function buy() payable {
        require(block.timestamp >= icoSince);
        require(block.timestamp <= icoTill);
        require(msg.value > 0);

        uint256 amount = msg.value * buyPrice;                  // calculates the amount, 1 ethereum = 205 tokens
        uint256 bonus = getBonus(collectedEthers, msg.value) * buyPrice;

        uint256 totalAmount = amount + bonus;

        if (balanceOf[this] < totalAmount) throw;               // checks if it has enough to sell

        collectedEthers += msg.value;
        balanceEthersOf[msg.sender] += msg.value;
        balanceOf[msg.sender] += totalAmount;                   // adds the amount to buyer's balance
        balanceOf[this] -= totalAmount;                         // subtracts amount from seller's balance

        if(bonus > 0) {
            BonusEarned(msg.sender, bonus);
        }

        Transfer(this, msg.sender, amount);                     // execute an event reflecting the change
    }

    function goalReachedInternal(uint256 time) internal returns (bool success) {
        if(time > icoTill) {
            if(collectedEthers >= minEthersCollected) {
                locked = false;

                icoSucceed = true;

                totalSupply = 50000000 ether - balanceOf[this];
                balanceOf[this] = 0;


                return true;
            }
        }

        return false;
    }

    function goalReached() returns (bool success) {
        return goalReachedInternal(block.timestamp);
    }

    function transferEther(address to) onlyOwner returns (bool success) {
        if(icoSucceed) {
            to.transfer(collectedEthers);

            return true;
        }

        return false;
    }

    function refundInternal(uint256 time, address to) returns (bool success) {
        if(time > icoTill) {
            if(!icoSucceed) {
                if(balanceEthersOf[to] > 0) {
                    uint256 ethers = balanceEthersOf[to];

                    balanceEthersOf[to] = 0;
                    balanceOf[to] = 0;

                    to.transfer(ethers);

                    return true;
                }
            }
        }

        return false;
    }


    function refund() returns (bool success) {
        return refundInternal(block.timestamp, msg.sender);
    }

    function setLocked(bool _locked) onlyOwner returns (bool success) {
        if(icoSucceed) {
            locked = _locked;

            return true;
        }

        return false;
    }

    /* This unnamed function is called whenever someone tries to send ether to it */
    function () {
        throw;     // Prevents accidental sending of ether
    }
}