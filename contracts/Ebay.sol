//SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "hardhat/console.sol";

/// @title Ebay
/// @notice Smart contract for auction based market place.
contract Ebay {
    // 1. Allow sellers to create auctions.
    // 2. Allow buyers to  make offer for an auction.
    // 3. Allow buyer to accept the highest offer at the end the auction.
    // 4. Getter functions for the frontend.

    /// ============ Mutable storage ============

    /// @notice Auction struct
    struct Auction {
        uint id;
        address seller;
        string name;
        string description;
        uint minimumOfferPrice;
        uint auctionEnd;
        uint bestOfferId;
        uint[] offerIds;
        bool isActive;
    }

    /// @notice List of all auctions
    mapping(uint => Auction) public auctions;

    /// @notice Id of the next auction
    uint private nextAuctionId = 1;

    /// @notice Offer struct
    struct Offer {
        uint id;
        uint auctionId;
        address buyer;
        uint offerPrice;
    }

    /// @notice List of all Offer
    mapping(uint => Offer) public offers;

    /// @notice Id of the next offer
    uint private nextOfferId = 1;

    /// @notice Mapping of sellers and their auctions
    mapping(address => uint[]) private userAuctions;

    /// @notice Mapping of buyers and their offers
    mapping(address => uint[]) private userOffers;

    mapping(uint => address[]) private auctionUsers;

    address private manager;

    /// ============ Modifiers ============

    /// @notice Ensure auction exists
    modifier auctionExists(uint _auctionId) {
        // Check if auctionId is valid
        require(
            _auctionId > 0 && _auctionId < nextAuctionId,
            "Auction does not exist"
        );
        _;
    }

    /// @notice Ensure auction exists
    modifier auctionIsActive(uint _auctionId) {
        // Check if auctionId is active
        Auction memory auction = auctions[_auctionId];
        require(auction.isActive, "Auction is not active");
        _;
    }

    /// ============ Functions ============

    /// @notice Creates a new auction.
    /// @param _name — name of the auction.
    /// @param _description — auction description.
    /// @param _minimumOfferPrice — the minimum offer price this auction will accept.
    /// @param _duration — the duration, in seconds, for which the auction will accept offers.
    function createAuction(
        string calldata _name,
        string calldata _description,
        uint _minimumOfferPrice,
        uint _duration
    ) external {
        // Minimum offer price should be greater than 0
        require(
            _minimumOfferPrice > 0,
            "Minimum offer price should be greater than 0"
        );

        // Duration should be between 1 to 10 days
        require(
            _duration >= 1 days && _duration <= 10 days,
            "Duration should be between 1 to 10 days"
        );

        uint[] memory offerIds = new uint[](0);

        auctions[nextAuctionId] = Auction(
            nextAuctionId,
            msg.sender,
            _name,
            _description,
            _minimumOfferPrice,
            block.timestamp + _duration,
            0,
            offerIds,
            true
        );

        // Save the auction to user auction mapping
        userAuctions[msg.sender].push(nextAuctionId);

        // Increment the auction counter
        nextAuctionId++;

        manager = msg.sender;
    }

    /// @notice Creates a new offer for an auction.
    /// @param _auctionId - id of the auction
    function createOffer(uint _auctionId)
        external
        payable
        auctionExists(_auctionId)
        auctionIsActive(_auctionId)
    {
        // Retrieve the auction
        Auction storage auction = auctions[_auctionId];

        // Check if auction has expired
        require(block.timestamp < auction.auctionEnd, "Auction expired");

        // Retrieve the best offer
        Offer storage bestOffer = offers[auction.bestOfferId];

        //Get last offer price from this user
        uint prevPrice = 0;
        Offer[] memory prevOffers = getUserOffers(msg.sender);
        if (prevOffers.length > 0) {
            Offer memory lastOffer = prevOffers[prevOffers.length - 1];
            prevPrice = lastOffer.offerPrice;
        }

        uint newPrice = msg.value;
        if (prevPrice + newPrice > bestOffer.offerPrice) {
            newPrice += prevPrice;
            //If user still pays the full amount + margin, refund the unnecessary amount
            if (prevOffers.length > 0 && msg.value > bestOffer.offerPrice) {
                uint previousPrice = prevOffers[prevOffers.length - 1]
                    .offerPrice;
                uint remainder = msg.value - previousPrice;
                newPrice = previousPrice + remainder;
                payable(msg.sender).transfer(previousPrice);
            }
        }

        // price should be greater than minimum offer price
        require(
            newPrice >= auction.minimumOfferPrice &&
                newPrice > bestOffer.offerPrice,
            "Price should be greater than minimum offer price and the best offer"
        );

        // Update auction with new offer
        auction.bestOfferId = nextOfferId;

        // Create a new offer
        offers[nextOfferId] = Offer(
            nextOfferId,
            _auctionId,
            msg.sender,
            newPrice
        );

        auction.offerIds.push(nextOfferId);

        // Save the auction to user offer mapping
        userOffers[msg.sender].push(nextOfferId);

        // Increment the offer counter
        nextOfferId++;

        //Add user to the auction
        auctionUsers[_auctionId].push(msg.sender);
    }

    /// @notice Executes the auction trade.
    /// @param _auctionId - id of the auction.
    function trade(uint _auctionId)
        external
        auctionExists(_auctionId)
        auctionIsActive(_auctionId)
    {
        // Retrieve the auction
        Auction storage auction = auctions[_auctionId];

        // Retrieve the best offer
        Offer storage bestOffer = offers[auction.bestOfferId];

        // Check if auction is active
        require(
            block.timestamp > auction.auctionEnd,
            "Auction is still active"
        );

        // Loop through all the offers
        for (uint i = 0; i < auction.offerIds.length; i++) {
            uint offerId = auction.offerIds[i];
            Offer storage offer = offers[offerId];

            // Refund offer price of all offers except the best offer to corresponding buyer
            if (offerId != bestOffer.id) {
                payable(offer.buyer).transfer(offer.offerPrice);
            }
        }

        // Send winning offer price to the seller
        payable(auction.seller).transfer(bestOffer.offerPrice);
    }

    function cancelAuction(uint _auctionId)
        external
        payable
        auctionExists(_auctionId)
        auctionIsActive(_auctionId)
    {
        require(msg.sender == manager, "Only auction creator can cancel it!");

        address[] memory users = auctionUsers[_auctionId];

        for (uint i = 0; i < users.length; i++) {
            Offer[] memory prevOffers = getUserOffers(users[i]);
            Offer memory lastOffer = prevOffers[prevOffers.length - 1];
            //return money to each user
            payable(lastOffer.buyer).transfer(lastOffer.offerPrice);
        }

        auctions[_auctionId].isActive = false;
    }

    /// ============ Getter Functions ============

    /// @notice - List of all the auctions
    function getAuctions() external view returns (Auction[] memory) {
        Auction[] memory _auctions = new Auction[](nextAuctionId - 1);
        for (uint i = 1; i < nextAuctionId; i++) {
            _auctions[i - 1] = auctions[i];
        }
        return _auctions;
    }

    /// @notice - List of auctions for a seller
    /// @param _user - Seller address
    function getUserAuctions(address _user)
        external
        view
        returns (Auction[] memory)
    {
        uint[] storage userAuctionIds = userAuctions[_user];
        Auction[] memory _auctions = new Auction[](userAuctionIds.length);
        for (uint i = 0; i < userAuctionIds.length; i++) {
            uint auctionId = userAuctionIds[i];
            _auctions[i] = auctions[auctionId];
        }
        return _auctions;
    }

    /// @notice - List of offers from a buyer
    /// @param _user - Buyer address
    function getUserOffers(
        address _user //Changed from external to private: how will it afect the gas price?
    ) private view returns (Offer[] memory) {
        uint[] storage userOfferIds = userOffers[_user];
        Offer[] memory _offers = new Offer[](userOfferIds.length);
        for (uint i = 0; i < userOfferIds.length; i++) {
            uint offerId = userOfferIds[i];
            _offers[i] = offers[offerId];
        }
        return _offers;
    }

    /// @notice - List of offers for an auction
    /// @param _auctionId - Auction Id
    function getAuctionOffers(uint _auctionId)
        external
        view
        auctionExists(_auctionId)
        returns (Offer[] memory)
    {
        // Retrieve the auction
        Auction storage auction = auctions[_auctionId];
        uint[] storage auctionOfferIds = auction.offerIds;

        Offer[] memory _offers = new Offer[](auctionOfferIds.length);
        for (uint i = 0; i < auctionOfferIds.length; i++) {
            uint offerId = auctionOfferIds[i];
            _offers[i] = offers[offerId];
        }
        return _offers;
    }

    /// @notice - List of users in an auction
    /// @param _auctionId - Auction Id
    function getAuctionUsers(uint _auctionId)
        external
        view
        auctionExists(_auctionId)
        returns (address[] memory)
    {
        return auctionUsers[_auctionId];
    }
}
