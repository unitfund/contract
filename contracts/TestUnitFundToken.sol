pragma solidity ^0.4.2;

import "./UnitFundToken.sol";

contract TestUnitFundToken is UnitFundToken {
    function TestUnitFundToken(uint256 _icoSince, uint256 _icoTill, uint256 _minEthersCollected)
            UnitFundToken(_icoSince, _icoTill, _minEthersCollected)
    {

    }

    function goalReached(uint256 time) returns (bool success) {
        return goalReachedInternal(time);
    }

    function refund(uint256 time) returns (bool success) {
        return refundInternal(time, msg.sender);
    }

    /* This unnamed function is called whenever someone tries to send ether to it */
    function () payable {
        buyInternal(block.timestamp, msg.sender, msg.value);
    }
}