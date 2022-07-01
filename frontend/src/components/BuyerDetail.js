import { useParams } from "react-router-dom"
import { ethers } from "ethers";
import React, { useEffect, useState, useContext } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Table from "react-bootstrap/Table";
import BlockchainContext from '../store/blockchain-context';
import { showError } from "../utils/common";

const BuyerDetail = () => {
    const params = useParams();
    const [userOffers, setuserOffers] = useState([]);
    const blockchainContext = useContext(BlockchainContext);
    const provider = blockchainContext.provider;

    console.log(params.offerid);
    
    const getBidderInfo = async () => {
        try {
            provider.ebay &&
            setuserOffers(await provider.ebay.getUserOffers(params.id));

        } catch (error) {
            showError(error);
        }
    };

    useEffect(() => {
        getBidderInfo();

    }, [provider]);


    return (
        <Container className="py-2">
            {/* Offer list */}
            <h4>User Offers</h4>
            <Row>
                <Col>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Offer id</th>
                                <th>Auction id</th>
                                <th>Buyer's address</th>
                                <th>Offer Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userOffers.map((offer) => (
                                <tr>
                                    <td>{ethers.BigNumber.from(offer.id).toNumber()}</td>
                                    <td>{ethers.BigNumber.from(offer.auctionId).toNumber()}</td>
                                    <td>{offer.buyer}</td>
                                    <td>{ethers.BigNumber.from(offer.offerPrice).toNumber()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>
        </Container>
    );
}

export default BuyerDetail;