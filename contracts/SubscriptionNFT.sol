// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC4907.sol";

/// @title A time-limited subscription NFT with rentable slots (ERC-4907)
/// @notice Mint 30-, 60- or 90-day subscriptions @ 0.01 ETH per 30 days,
///         then optionally rent them out via the `user` slot
contract SubscriptionNFT is
    ERC721,
    ERC4907,
    ERC721Enumerable,
    Ownable
{
    uint256 public nextTokenId;
    mapping(uint256 => uint256) public expiresAt;

    /// @notice Deploy; msg.sender becomes owner
    constructor() ERC721("DemoSub", "DSUB") {}

    /// @notice Mint a new subscription NFT for 30/60/90 days
    /// @param durationSeconds Must be exactly 30 days, 60 days or 90 days
    function mintSubscription(uint256 durationSeconds) external payable {
        uint256 months_ = durationSeconds / 30 days;
        require(months_ >= 1 && months_ <= 3, "Only 1-3 months");
        require(msg.value == 0.01 ether * months_, "Wrong ETH amount");

        uint256 tid = nextTokenId++;
        _mint(msg.sender, tid);
        expiresAt[tid] = block.timestamp + durationSeconds;
    }

    /// @notice True if the subscription on `tokenId` is still active
    function isValid(uint256 tokenId) public view returns (bool) {
        return tokenId < nextTokenId && block.timestamp <= expiresAt[tokenId];
    }

    // ——— ERC721Enumerable overrides ———

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    )
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /// @notice Report all supported interfaces: ERC-721, ERC-4907, ERC-165, ERC-721Enumerable
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC4907, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
