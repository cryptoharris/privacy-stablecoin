// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; // Import SafeERC20

contract MyStablecoin is ERC20, Ownable {
    using SafeERC20 for IERC20; // Use SafeERC20 for ERC20 functions

    // Mapping to store the amounts associated with secret hashes
    // bytes32 is the type returned by keccak256
    mapping(bytes32 => uint256) public privacyNotes;

    // --- NEW DEBUG EVENT ---
    // We emit this when a note is created so we can see the exact hash on Arbiscan
    event NoteGenerated(bytes32 indexed secretHash, uint256 amount);

    constructor(address initialOwner)
        ERC20("My Stablecoin", "MSC")
        Ownable(initialOwner)
    {}

    // --- Core Stablecoin Functions ---

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // --- v3 Burn Function ---
    // Allows the owner to burn their own tokens
    function burn(uint256 amount) public onlyOwner {
        _burn(msg.sender, amount);
    }

    // --- Privacy Note Functions (v4 - Shielded Pool Logic + v3 Replay Fix) ---

    // Step 1 (Send): User approves contract, then calls this to lock tokens
    function generatePrivacyNote(uint256 amount, bytes32 _secretHash) public {
        require(amount > 0, "Amount must be greater than zero");
        require(privacyNotes[_secretHash] == 0, "Note with this hash already exists"); // Prevent overwriting existing notes

        // Pull the approved tokens from the sender to this contract (escrow)
        // Use safeTransferFrom from SafeERC20 library
        IERC20(this).safeTransferFrom(msg.sender, address(this), amount);

        // Store the amount associated with the secret hash
        privacyNotes[_secretHash] = amount;

        // --- EMIT DEBUG EVENT ---
        emit NoteGenerated(_secretHash, amount);
    }

    // Step 2 (Receive): User provides the secret hash to redeem tokens
    // Changed _secret from string to bytes32 for v5
    function redeemNote(bytes32 _secretHash, address _to) public {
        require(_to != address(0), "Cannot redeem to the zero address"); // Security check

        // Check if the note exists and holds an amount
        uint256 amount = privacyNotes[_secretHash];
        require(amount > 0, "Note not found or already redeemed"); // v3 Replay Fix integrated

        // Mark the note as redeemed *before* the transfer (Checks-Effects-Interactions pattern)
        privacyNotes[_secretHash] = 0; // v3 Replay Fix

        // Transfer the tokens from this contract (escrow) to the recipient
        // Use safeTransfer from SafeERC20 library
        IERC20(this).safeTransfer(_to, amount);
    }

    // --- Standard ERC20 Overrides (if necessary, often not needed with OZ defaults) ---
    // e.g., decimals(), name(), symbol(), totalSupply(), balanceOf(), transfer(),
    // allowance(), approve(), transferFrom() are inherited and usually sufficient.
}