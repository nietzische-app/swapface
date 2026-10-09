import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-center">
      <div>
        <p className="text-sm text-[#c4b5fd]">404</p>
        <h1 className="mt-2 text-2xl font-semibold">Bu sayfa yok</h1>
        <Link href="/" className="mt-4 inline-block text-sm text-[#ddd6fe] underline">
          Stüdyoya dön
        </Link>
      </div>
    </div>
  );
}
