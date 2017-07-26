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
}