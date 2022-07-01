import React, { useEffect, useState, useContext } from "react";
import { ethers } from "ethers";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { showError } from "../utils/common";
import BlockchainContext from '../store/blockchain-context';

const AuctionDetail = () => {
  // State to store offers
  const [contractValues, setContractValues] = useState({ offers: [], bestOffer: ethers.BigNumber.from('0') });
  // State to store offer
  const [offer, setOffer] = useState(0);

  const location = useLocation();

  const { auction } = location.state;
  const bestOfferId = ethers.BigNumber.from(auction.bestOfferId).toNumber();

  const blockchainContext = useContext(BlockchainContext);
  const provider = blockchainContext.provider;
  /**
   * Create a new offer
   * @param {*} e
   */
  const createOffer = async (e) => {
    e.preventDefault();
    try {
      await provider.ebay.createOffer(auction.id, { value: offer });
      setOffer(0);
    } catch (error) {
      showError(error);
    }
  };

  /**
   * Perform auction trade
   */
  const trade = async () => {
    try {
      await provider.ebay.trade(auction.id);
      setOffer(0);
    } catch (error) {
      showError(error);
    }
  };

  // Get all offers
  useEffect(() => {
    (async () => {
      try {
        provider.ebay &&
          setContractValues({
            offers: await provider.ebay.getAuctionOffers(auction.id),
            bestOffer: (await provider.ebay.offers(bestOfferId)).offerPrice,
          });

      } catch (error) {
        showError(error);
      }
    })();
  }, [auction]);

  return (
    <Container className="py-2">
      <Link to="/">
        <Button className="mb-2" variant="outline-primary">
          🔙 All Auctions
        </Button>
      </Link>

      <Row className="">
        <Col md={12} className="mb-4">
          <Card>
            <Card.Body>
              <Button variant="success float-end" onClick={trade}>
                Trade Best Offer
              </Button>
              <Card.Title>{auction.name}</Card.Title>
              <Card.Text>{auction.description}</Card.Text>

              <hr />
              <Form
                className="form-inline"
                style={{ maxWidth: "400px" }}
                onSubmit={createOffer}
              >
                <Row>
                  <Col>
                    <Form.Group controlId="offer">
                      <Form.Control
                        type="number"
                        required
                        value={offer}
                        onChange={(e) => setOffer(e.target.value)}
                        placeholder="Enter offer"
                      />
                      <Form.Text className="text-muted">
                        Minimum offer is {ethers.BigNumber.from(contractValues.bestOffer).toNumber() + 1}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col>
                    <Button variant="primary" type="submit">
                      Submit Offer
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
            <Card.Footer>
              <small className="text-muted">
                Ends On: <b>{auction.auctionEnd}</b>
              </small>
              <br />
              <small className="text-muted">
                Posted by: <b>{auction.seller}</b>
              </small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Offer list */}
      <h4>All Offers</h4>
      <Row>
        <Col>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {contractValues.offers.map((offer) => (
                <tr>
                  <Link to={`/buyer/${offer.buyer}`}>
                    <td>{offer.buyer}</td>
                  </Link>
                  <td>{offer.offerPrice.toString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
};

export default AuctionDetail;
