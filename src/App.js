import logo from './logo.svg';
import './App.css';
import { Button, Col, Row, Form } from "react-bootstrap";
import { useRef} from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { testMint, sendToken } from './utiles';
function App() {
  const amount = useRef();
  const toPubkey = useRef();
  const wallet = useWallet();
  const send = async () => {
    await sendToken(wallet, amount.current.value*1000, toPubkey.current.value);
    console.log('send: ', amount.current.value);
  }
  const tokenMint = async () => {
    await testMint(wallet);
    console.log('Token Minted...');
  }
  return (
    <div className="App">
      <header className="App-header">
        <WalletMultiButton className="wallet-btn"/>
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          This is spl token transfer UI.
        </p>
        <Row>
        <Col>
          <Form.Control
            type="text"
            ref={toPubkey}
            placeholder="Wallet address"
          />
        </Col>
        <Col>
          <Form.Control
            type="number"
            ref={amount}
            placeholder="Amount"
          />
        </Col>
        <Col>
          <Button
            type="submit"
            onClick={send}
          >Transfer
          </Button>
        </Col>
        <Col>
          <Button
            type="submit"
            onClick={tokenMint}
          >?Mint
          </Button>
        </Col>
      </Row>
      </header>
    </div>
  );
}

export default App;
