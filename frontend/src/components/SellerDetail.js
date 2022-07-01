import { useParams } from "react-router-dom"
import { ethers } from "ethers";
import React, { useEffect, useState, useContext } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Table from "react-bootstrap/Table";
import BlockchainContext from '../store/blockchain-context';
import Button from "react-bootstrap/Button";
import { showError } from "../utils/common";

const SellerDetail = () => {
    const params = useParams();
    const [sellerOffers, setsellerOffers] = useState([]);
    const blockchainContext = useContext(BlockchainContext);
    const provider = blockchainContext.provider;

 /**
   * Perform auction trade
   */
  const cancel = async () => {
    try {
      await provider.ebay.cancelAuction(params.auctionId);
    } catch (error) {
      showError(error);
    }
  };


    const getBidderInfo = async () => {
        try {
            provider.ebay &&
                setsellerOffers(await provider.ebay.getUserAuctions(params.id));

        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        getBidderInfo();

    }, [provider]);

    return (
        <Container className="py-2">
            {/* Offer list */}
            <h4>Seller's auctions</h4>
            <Row>
                <Col>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Id</th>
                                <th>Seller's address</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Auction End</th>
                                <th>Is active?</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sellerOffers.map((offer) => (
                                <tr>
                                    <td>{ethers.BigNumber.from(offer.id).toNumber()}</td>
                                    <td>{offer.seller}</td>
                                    <td>{offer.name}</td>
                                    <td>{offer.description}</td>
                                    <td>{new Date(ethers.BigNumber.from(offer.auctionEnd).toNumber() * 1000).toString()}</td>
                                    <td>{offer.isActive ? "Active" : "Cancelled"}</td>
                                    <td>
                                        <Button variant="success float-end" onClick={cancel}>
                                            Cancel Auction
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>
        </Container>
    );
}

export default SellerDetail;