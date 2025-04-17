import Link from "next/link";

export default function PaymentSuccess() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">Pagamento realizado com sucesso! 🎉</h1>
      <p className="mb-4">Sua compra foi efetuada com sucesso.</p>
      <Link href="/dashboard" className="mt-4 border rounded-md px-4 py-2 cursor-pointer">
        Ir para o Dashboard
      </Link>
    </div>
  );
} 