export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      <div className="w-20 h-20 mb-4 rounded-2xl bg-[#FF6200]/10 flex items-center justify-center animate-pulse">
        <img src="/icon-192.png" className="w-12 h-12" alt="MarketBridge Icon" />
      </div>
      <div className="text-foreground text-2xl font-black tracking-tight">MarketBridge</div>
      <div className="mt-3 w-10 h-10 border-[3px] border-[#FF6200] border-t-transparent rounded-full animate-spin" />
      <div className="mt-2 text-zinc-500 font-bold tracking-widest uppercase text-[10px]">Loading campus marketplace...</div>
    </div>
  );
}
