// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// @dev Minimal ERC-4907 interface
interface IERC4907 is IERC165 {
    event UpdateUser(uint256 indexed tokenId, address indexed user, uint64 expires);

    /// @notice set a user (renter) for `tokenId` until `expires`
    function setUser(uint256 tokenId, address user, uint64 expires) external;

    /// @notice the current user of `tokenId`
    function userOf(uint256 tokenId) external view returns (address);

    /// @notice unix timestamp when user’s right expires
    function userExpires(uint256 tokenId) external view returns (uint256);
}

/// @dev ERC-4907 “mixin.” Does *not* itself inherit ERC721.
///      Exposes a `user` slot alongside the usual ownership.
abstract contract ERC4907 is IERC4907, ERC165 {
    struct UserInfo { address user; uint64 expires; }
    mapping(uint256 => UserInfo) internal _users;

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId)
      public view virtual override(ERC165, IERC165)
      returns (bool)
    {
        return
          interfaceId == type(IERC4907).interfaceId ||
          super.supportsInterface(interfaceId);
    }

    /// @inheritdoc IERC4907
    function userOf(uint256 tokenId) public view virtual override returns (address) {
        if (uint256(_users[tokenId].expires) >= block.timestamp) {
            return _users[tokenId].user;
        }
        return address(0);
    }

    /// @inheritdoc IERC4907
    function userExpires(uint256 tokenId) public view virtual override returns (uint256) {
        return _users[tokenId].expires;
    }

    /// @inheritdoc IERC4907
    function setUser(
      uint256 tokenId,
      address user,
      uint64 expires
    ) public virtual override {
        IERC721 nft = IERC721(address(this));
        address owner = nft.ownerOf(tokenId);
        bool approved = (nft.getApproved(tokenId) == msg.sender)
          || nft.isApprovedForAll(owner, msg.sender);
        require(
          msg.sender == owner || approved,
          "ERC4907: not owner/approved"
        );
        _users[tokenId] = UserInfo(user, expires);
        emit UpdateUser(tokenId, user, expires);
    }
}
