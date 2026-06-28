import Image from "next/image";
import clsx from "clsx";

const SIZES = {
  sm: { box: 32, text: "text-lg" },
  md: { box: 40, text: "text-xl" },
  lg: { box: 48, text: "text-2xl" },
};

export default function Logo({ size = "md", showWordmark = true, className }) {
  const { box, text } = SIZES[size];
  return (
    <a href="/" className={clsx("inline-flex items-center gap-2.5 group", className)} aria-label="LedgerFlow home">
      <Image
        src="/assets/ledgerflow-icon.png"
        alt="LedgerFlow logo"
        width={box}
        height={box}
        className="rounded-lg object-contain"
        priority
      />
      {showWordmark && (
        <span className={clsx("font-display font-bold tracking-tight text-white", text)}>
          Ledger<span className="text-primary">Flow</span>
        </span>
      )}
    </a>
  );
}
