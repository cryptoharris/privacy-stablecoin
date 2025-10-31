// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// --- This is the new TSS Utility Token Contract ---
contract TSSToken is ERC20, Ownable {
    using SafeERC20 for IERC20;

    // --- NEW EVENT ---
    // We emit this when a note is created so we can see the exact hash on Arbiscan
    // Note: This contract *can* be used with the PrivacyPool, but its primary
    // function here is just to be the mintable/burnable project token.
    // We are keeping the privacy logic in PrivacyPool.sol.
    // This event is kept for compatibility with old logic if ever needed,
    // but the main privacy functions (generate/redeem) are in PrivacyPool.sol.
    event NoteGenerated(bytes32 indexed secretHash, uint256 amount);


    // --- CONSTRUCTOR ---
    // Updated to "The Secret Service" (TSS)
    constructor(address initialOwner)
        ERC20("The Secret Service", "TSS")
        Ownable(initialOwner)
    {}

    // --- Core Token Functions ---

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // --- v3 Burn Function ---
    // Allows the owner to burn their own tokens
    function burn(uint256 amount) public onlyOwner {
        _burn(msg.sender, amount);
    }

    // --- Old Privacy Functions (Kept for historical reference/ABI compatibility if needed, but NOT USED by the V5 App) ---
    // The main app now uses PrivacyPool.sol for these functions.
    
    mapping(bytes32 => uint256) public privacyNotes;

    function generatePrivacyNote(uint256 amount, bytes32 _secretHash) public {
        require(amount > 0, "Amount must be greater than zero");
        require(privacyNotes[_secretHash] == 0, "Note with this hash already exists");
        IERC20(this).safeTransferFrom(msg.sender, address(this), amount);
        privacyNotes[_secretHash] = amount;
        emit NoteGenerated(_secretHash, amount);
    }

    function redeemNote(bytes32 _secretHash, address _to) public {
        require(_to != address(0), "Cannot redeem to the zero address");
        uint256 amount = privacyNotes[_secretHash];
        require(amount > 0, "Note not found or already redeemed");
        privacyNotes[_secretHash] = 0;
        IERC20(this).safeTransfer(_to, amount);
    }
}
