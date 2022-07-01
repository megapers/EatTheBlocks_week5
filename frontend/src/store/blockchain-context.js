import { createContext, useState, useEffect } from 'react';
import { getBlockchain } from '../utils/common';

const BlockchainContext = createContext();

export function BlockchainContextProvider(props) {
    const [provider, setProvider] = useState(null);
    const [isLoaded, setIsloaded] = useState(false);

    useEffect(() => {
        async function fetchData() {
            const walletProvider = await getBlockchain();
            setProvider(walletProvider);
            setIsloaded(true);
        }
        fetchData();
    }, []);

    const context = {
        provider, isLoaded
    };

    return (

        <BlockchainContext.Provider value={context}>
            {props.children}
        </BlockchainContext.Provider>)
}

export default BlockchainContext;