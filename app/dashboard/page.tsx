import WalletCard from "./components/WalletCard.client";
import PnlCard from "./components/PnlCard.client";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#9B3E14] flex items-center justify-center">
      <div className="flex gap-6">
        <WalletCard />
        <PnlCard />
      </div>
    </main>
  );
}
