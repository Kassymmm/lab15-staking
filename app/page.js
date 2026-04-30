"use client";

import { useState } from "react";
import { ethers } from "ethers";
import styles from "./page.module.css";

const TOKEN_ADDRESS = "0xb4EEc91dA0e675fC09A47a4eD6e195cD3175Eb2B";
const STAKING_ADDRESS = "0x80872D3ebb2983fBdFa032577d4786Ffc9B236bf";

export default function Home() {
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("0");
  const [reward, setReward] = useState("0");
  const [loading, setLoading] = useState("");

  const switchToBnbTestnet = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x61" }],
      });
    } catch (error) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x61",
              chainName: "BNB Smart Chain Testnet",
              nativeCurrency: {
                name: "tBNB",
                symbol: "tBNB",
                decimals: 18,
              },
              rpcUrls: ["https://data-seed-prebsc-1-s1.bnbchain.org:8545"],
              blockExplorerUrls: ["https://testnet.bscscan.com"],
            },
          ],
        });
      } else {
        throw error;
      }
    }
  };

  const getProvider = () => new ethers.BrowserProvider(window.ethereum);

  const loadData = async (wallet) => {
    const provider = getProvider();

    const token = new ethers.Contract(
      TOKEN_ADDRESS,
      ["function balanceOf(address) view returns (uint256)"],
      provider
    );

    const staking = new ethers.Contract(
      STAKING_ADDRESS,
      ["function calculateReward(address) view returns (uint256)"],
      provider
    );

    const tokenBalance = await token.balanceOf(wallet);
    const userReward = await staking.calculateReward(wallet);

    setBalance(ethers.formatUnits(tokenBalance, 18));
    setReward(ethers.formatUnits(userReward, 18));
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Install MetaMask");
      return;
    }

    await switchToBnbTestnet();

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setAccount(accounts[0]);
    await loadData(accounts[0]);
  };

  const approve = async () => {
    if (!amount) return alert("Enter amount");

    setLoading("Approving tokens...");

    const provider = getProvider();
    const signer = await provider.getSigner();

    const token = new ethers.Contract(
      TOKEN_ADDRESS,
      ["function approve(address,uint256)"],
      signer
    );

    const tx = await token.approve(
      STAKING_ADDRESS,
      ethers.parseUnits(amount, 18)
    );

    await tx.wait();
    setLoading("");
    alert("Approve successful");
  };

  const stake = async () => {
    if (!amount) return alert("Enter amount");

    setLoading("Staking tokens...");

    const provider = getProvider();
    const signer = await provider.getSigner();

    const staking = new ethers.Contract(
      STAKING_ADDRESS,
      ["function stake(uint256)"],
      signer
    );

    const tx = await staking.stake(ethers.parseUnits(amount, 18));

    await tx.wait();
    await loadData(account);

    setAmount("");
    setLoading("");
    alert("Stake successful");
  };

  const unstake = async () => {
    setLoading("Unstaking tokens...");

    const provider = getProvider();
    const signer = await provider.getSigner();

    const staking = new ethers.Contract(
      STAKING_ADDRESS,
      ["function unstake()"],
      signer
    );

    const tx = await staking.unstake();

    await tx.wait();
    await loadData(account);

    setLoading("");
    alert("Unstake successful");
  };

  return (
    <main className={styles.wrapper}>
      <section className={styles.hero}>
        <div>
          <p className={styles.label}>BNB Testnet Staking</p>
          <h1>Grow your tokens with simple staking</h1>
          <p className={styles.description}>
            Connect your wallet, approve tokens, stake them and claim rewards.
          </p>
        </div>

        <button className={styles.connect} onClick={connectWallet}>
          {account
            ? `${account.slice(0, 6)}...${account.slice(-4)}`
            : "Connect Wallet"}
        </button>
      </section>

      <section className={styles.dashboard}>
        <div className={styles.infoCard}>
          <span>Your Balance</span>
          <strong>{Number(balance).toFixed(4)}</strong>
          <p>Available tokens</p>
        </div>

        <div className={styles.infoCard}>
          <span>Pending Reward</span>
          <strong>{Number(reward).toFixed(6)}</strong>
          <p>Estimated reward</p>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Stake Tokens</h2>
          <span>APY 10%</span>
        </div>

        <div className={styles.inputBox}>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button onClick={() => setAmount(balance)}>MAX</button>
        </div>

        {loading && <p className={styles.loading}>{loading}</p>}

        <div className={styles.buttons}>
          <button onClick={approve}>Approve</button>
          <button onClick={stake}>Stake</button>
          <button onClick={unstake}>Unstake</button>
        </div>
      </section>
    </main>
  );
}