import "./App.css";
import { useContext } from "react";
import Header from "./components/Header";
import { Route, Routes } from "react-router-dom";
import AuctionList from "./components/AuctionList";
import AuctionDetail from "./components/AuctionDetail";
import BuyerDetail from "./components/BuyerDetail";
import SellerDetail from "./components/SellerDetail";
import BlockchainContext from './store/blockchain-context';

function App() {
  const blockchainContext = useContext(BlockchainContext);
  const provider = blockchainContext.provider;

  return (
    <div>
      {blockchainContext.isLoaded ?
        <div>
          <Header />
          <Routes>
            <Route path="/" element={<AuctionList blockchain={provider} />} />
            <Route
              path="/auction/:id"
              element={<AuctionDetail blockchain={provider} />}
            />
            <Route
              path="/buyer/:id"
              element={<BuyerDetail blockchain={provider} />}
            />
            <Route
              path="/seller/:id/:auctionId"
              element={<SellerDetail blockchain={provider} />}
            />
          </Routes>
        </div>
        : <p>Loading...</p>}
    </div>
  );
}

export default App;
