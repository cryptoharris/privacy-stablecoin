// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PrivacyPool {
    using SafeERC20 for IERC20;

    // Struct to store note details
    struct Note {
        address tokenAddress;
        uint256 amount;
    }

    // Mapping from the secret hash to the Note struct
    mapping(bytes32 => Note) public privacyNotes;

    // Event emitted when a note is generated
    event NoteGenerated(
        bytes32 indexed secretHash,
        address indexed tokenAddress,
        uint256 amount
    );

    // Event emitted when a note is redeemed
    event NoteRedeemed(
        bytes32 indexed secretHash,
        address indexed tokenAddress,
        address indexed recipient,
        uint256 amount
    );

    // Error for attempting to generate a note with amount zero
    error ZeroAmount();
    // Error for attempting to generate a note over an existing hash
    error NoteAlreadyExists();
    // Error for attempting to redeem a non-existent or already redeemed note
    error InvalidOrRedeemedNote();
    // Error for attempting to redeem to the zero address
    error InvalidRecipientAddress();


    // --- Core Privacy Functions ---

    /**
     * @notice Locks specified ERC20 tokens in the contract, associated with a secret hash.
     * @dev The caller must have previously approved this contract to spend at least `_amount` of `_tokenAddress`.
     * @param _tokenAddress The address of the ERC20 token being locked.
     * @param _amount The amount of tokens to lock (in the token's smallest unit).
     * @param _secretHash A unique bytes32 hash generated off-chain from a secret only known to the sender/receiver.
     */
    function generatePrivacyNote(
        address _tokenAddress,
        uint256 _amount,
        bytes32 _secretHash
    ) public {
        if (_amount == 0) revert ZeroAmount();
        // Check if a note with this hash already exists (unlikely with good random secrets, but important)
        if (privacyNotes[_secretHash].amount != 0 || privacyNotes[_secretHash].tokenAddress != address(0)) {
            revert NoteAlreadyExists();
        }

        // Pull the approved tokens from the sender into this contract
        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _amount);

        // Store the note details
        privacyNotes[_secretHash] = Note({
            tokenAddress: _tokenAddress,
            amount: _amount
        });

        // Emit an event for off-chain indexing or confirmation
        emit NoteGenerated(_secretHash, _tokenAddress, _amount);
    }

    /**
     * @notice Allows redemption of locked tokens by providing the correct secret hash.
     * @param _secretHash The unique hash associated with the note to be redeemed.
     * @param _recipient The address to receive the redeemed tokens.
     */
    function redeemNote(bytes32 _secretHash, address _recipient) public {
        if (_recipient == address(0)) revert InvalidRecipientAddress();

        // Retrieve the note details from storage
        Note storage noteToRedeem = privacyNotes[_secretHash];
        uint256 amount = noteToRedeem.amount;
        address tokenAddress = noteToRedeem.tokenAddress;

        // Check if the note is valid (has amount > 0 and a token address)
        if (amount == 0 || tokenAddress == address(0)) {
            revert InvalidOrRedeemedNote();
        }

        // Mark the note as redeemed *before* the transfer (Checks-Effects-Interactions pattern)
        // Setting amount to 0 effectively deletes it for the require check above
        noteToRedeem.amount = 0;
        // Optional: clear tokenAddress too if desired, though amount=0 is sufficient
        // noteToRedeem.tokenAddress = address(0);


        // Transfer the tokens from this contract to the recipient
        IERC20(tokenAddress).safeTransfer(_recipient, amount);

        // Emit an event confirming redemption
        emit NoteRedeemed(_secretHash, tokenAddress, _recipient, amount);
    }

}
