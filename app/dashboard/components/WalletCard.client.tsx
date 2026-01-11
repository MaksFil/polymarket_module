'use client'

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";

// Server Actions
import { generateDepositQR } from "@/app/dashboard/actions/deposit";
import { withdrawUSDC } from "@/app/dashboard/actions/withdraw";
import { getPortfolio } from "@/app/dashboard/actions/getPortfolio";
import { getJoinedDate } from "@/app/dashboard/actions/getJoinedDate";
import { getProfile, updateProfile } from "@/app/dashboard/actions/updateProfile";

export default function WalletCard() {
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositInfo, setDepositInfo] = useState<DepositInfo | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("evm");

  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawAddress, setWithdrawAddress] = useState<string>("");
  const [withdrawStatus, setWithdrawStatus] = useState<string>("");

  const [profile, setProfile] = useState<{ name: string, avatar: string }>({ name: "My Wallet", avatar: "/icon/gallery_edit.svg" });
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [joined, setJoined] = useState<string>("Joined ...");

  const [portfolio, setPortfolio] = useState<PortfolioResponse>({
    success: false,
    portfolioNotUSDC: 0,
    usdcBalance: 0,
    totalPortfolio: 0,
    todayPnLDollars: 0,
    todayPnLPercent: 0,
    positions: [],
    error: undefined,
  });

  // ===== Fetch Portfolio =====
  const fetchPortfolio = async () => {
    try {
      const res = await getPortfolio();
      if (res.success) setPortfolio(res);
      else console.error("Failed to load portfolio:", res.error);
    } catch (err) {
      console.error("Error fetching portfolio:", err);
    }
  };

  useEffect(() => { fetchPortfolio(); }, []);

   // ===== Fetch Profile data =====
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        if (res.success) {
          setProfile(res.config);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };

    fetchProfile();
  }, []);

  // ===== Joined Date =====
  useEffect(() => {
    const fetchJoined = async () => {
      try {
        const res = await getJoinedDate();
        if (res.success && res.joined) setJoined(res.joined);
      } catch (err) {
        console.error("Error fetching joined date:", err);
      }
    };
    fetchJoined();
  }, []);

  // ===== Deposit =====
  const handleDeposit = async () => {
    try {
      const info = await generateDepositQR();
      setDepositInfo(info);
      setSelectedNetwork("evm");
      setDepositModalOpen(true);
    } catch (err) {
      console.error("Deposit error:", err);
    }
  };

  // ===== Withdraw =====
  const handleWithdraw = async () => {
    if (!withdrawAddress) { setWithdrawStatus("Please enter a recipient address"); return; }
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(withdrawAddress)) { setWithdrawStatus("Invalid Polygon address"); return; }
    if (!withdrawAmount || withdrawAmount <= 0) { setWithdrawStatus("Enter a valid amount"); return; }

    try {
      setWithdrawStatus("Processing...");
      const result = await withdrawUSDC(withdrawAddress, withdrawAmount);
      if (result.success) {
        setWithdrawStatus("Success!");
        setWithdrawAmount(0);
        setWithdrawAddress("");
        setWithdrawModalOpen(false);
        await fetchPortfolio();
      } else setWithdrawStatus(result.error || "Withdraw failed");
    } catch (err) {
      console.error("Withdraw error:", err);
      setWithdrawStatus("Withdraw failed");
    }
  };

  // ===== Update Profile =====
  const saveName = async () => {
    if (!newName) return;
    const res = await updateProfile({ name: newName });
    if (res.success) { setProfile(res.config); setEditingName(false); }
  };

  const handleAvatarInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewURL = URL.createObjectURL(file);
    setProfile(prev => ({ ...prev, avatar: previewURL }));

    const res = await updateProfile({ file });
    if (res.success) {
      setProfile(res.config);
    } else {
      console.error("Failed to update avatar on server");
    }
  };

  return (
    <div className="w-[639px] h-[236px] bg-white rounded-[8px] border border-gray-200 p-5 shadow-[0_10px_45px_rgba(0,0,0,0.08)] flex flex-col justify-between">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <motion.div 
            whileHover={{ scale: 1.15 }} 
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 bg-[#FF6A00] rounded-full flex items-center justify-center cursor-pointer relative overflow-hidden"
          >
            {profile.avatar && profile.avatar !== "/icon/gallery_edit.svg" && (
              <img 
                src={profile.avatar} 
                alt="Avatar" 
                className="absolute inset-0 w-full h-full object-cover rounded-full"
              />
            )}

            {(!profile.avatar || profile.avatar === "/icon/gallery_edit.svg") && (
              <img 
                src="/icon/gallery_edit.svg" 
                alt="Default" 
                className="w-4 h-4 object-cover rounded-full"
              />
            )}
            
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleAvatarInput} 
            />
          </motion.div>
          {/* Name */}
          <div>
            <div className="flex items-center gap-2">
              {editingName ? (
                <div className="flex gap-1">
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="border rounded px-2 py-1 text-black text-sm" />
                  <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={saveName} className="bg-orange-500 text-white px-2 rounded">Save</motion.button>
                  <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setEditingName(false)} className="bg-gray-200 text-black px-2 rounded">Cancel</motion.button>
                </div>
              ) : (
                <p className="text-sm text-black font-bold flex items-center gap-1">
                  {profile.name}
                  <motion.img src="/icon/name-edit.png" alt="Edit Name" className="w-4 h-4 cursor-pointer"
                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => { setEditingName(true); setNewName(profile.name); }}
                  />
                </p>
              )}
            </div>
            <p className="text-xs text-gray-400">{joined}</p>
          </div>
        </div>

        {/* Portfolio */}
        <div className="flex items-center gap-6 text-gray-400">
          <div className="flex flex-col items-center">
            <p className="text-xs">Portfolio (Not USDC)</p>
            <p className="text-sm text-black font-bold">
              ${portfolio.portfolioNotUSDC?.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-px h-6 bg-black/10"></div>
          <div className="flex flex-col items-center">
            <p className="text-xs">USDC + Portfolio</p>
            <p className="flex items-center gap-1 text-sm text-black font-bold">
              <img src="/icon/dollar.png" alt="USDC" className="w-4 h-4" />
              ${portfolio.totalPortfolio?.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Balance & PnL */}
      <div className="flex flex-col items-start gap-[1px] mt-3">
        <div className="text-[40px] font-normal leading-[100%] tracking-[-0.02em] text-black" style={{ fontFamily: "'Euclid Circular A', sans-serif" }}>
          <NumberFlow value={portfolio.totalPortfolio || 0} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} locales="de-DE" /> USDC
        </div>
        <p className="text-xs flex items-center gap-1 relative -top-[2px]">
          <span className={(portfolio.todayPnLDollars || 0) >= 0 ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
            {(portfolio.todayPnLDollars || 0) >= 0 ? "+" : "-"}$
            {Math.abs(portfolio.todayPnLDollars || 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
            {(portfolio.todayPnLDollars || 0) >= 0 ? "▲" : "▼"}
            {(portfolio.todayPnLPercent || 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
          </span>
          <span className="text-gray-500 font-bold ml-1">Today</span>
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-3">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleDeposit} className="flex-1 bg-[#FF5100] hover:bg-[#ff7b1c] text-white py-3 rounded-xl text-sm flex items-center justify-center gap-2">
          <img src="/icon/deposit.png" className="w-4 h-4" /> Deposit
        </motion.button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setWithdrawModalOpen(true)} className="flex-1 border border-[#E1E1E1] bg-[#F8F8F8] hover:bg-[#E1E1E1] py-3 rounded-xl text-sm text-black flex items-center justify-center gap-2">
          <img src="/icon/withdraw.png" className="w-4 h-4" /> Withdraw
        </motion.button>
      </div>

      {/* Deposit Modal */}
      {depositModalOpen && depositInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[420px] shadow-xl flex flex-col items-center gap-4 animate-fadeIn">
            <h2 className="text-xl font-semibold text-gray-900">Deposit USDC</h2>

            <div className="flex gap-2">
              {Object.keys(depositInfo.addresses).map(net => (
                <motion.button
                  key={net}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  whileDrag={{ scale: 0.95 }}
                  className={`px-3 py-1 rounded-xl border ${selectedNetwork === net ? "bg-orange-500 text-white" : "text-black"}`}
                  onClick={() => setSelectedNetwork(net)}
                >
                  {net.toUpperCase()}
                </motion.button>
              ))}
            </div>

            {selectedNetwork && depositInfo.addresses[selectedNetwork] && (
              <>
                <img src={depositInfo.qrCodes[selectedNetwork]} alt="Deposit QR" className="w-52 h-52 rounded-lg border" />
                <p className="text-sm break-all text-black text-center">{depositInfo.addresses[selectedNetwork]}</p>
              </>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              whileDrag={{ scale: 0.95 }}
              className="mt-4 w-full py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl transition"
              onClick={() => setDepositModalOpen(false)}
            >
              Close
            </motion.button>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl flex flex-col gap-4 animate-fadeIn">
            <h2 className="text-xl font-semibold text-gray-900 text-center">Withdraw USDC</h2>

            <input
              type="text"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              placeholder="Recipient Address"
              className="border border-gray-300 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-gray-700 text-black"
            />
            <input
              type="number"
              min={0}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(Number(e.target.value))}
              placeholder="Amount"
              className="border border-gray-300 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-gray-700 text-black"
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              whileDrag={{ scale: 0.95 }}
              className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl transition"
              onClick={handleWithdraw}
            >
              Confirm Withdraw
            </motion.button>

            {withdrawStatus && (
              <p className={`text-sm text-center ${withdrawStatus === "Success!" ? "text-green-500" : "text-red-500"}`}>
                {withdrawStatus}
              </p>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              whileDrag={{ scale: 0.95 }}
              className="w-full py-2 border border-gray-300 rounded-xl text-gray-700 font-medium transition hover:bg-gray-100"
              onClick={() => setWithdrawModalOpen(false)}
            >
              Close
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
