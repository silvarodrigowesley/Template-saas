import { auth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { handlersAuth } from "@/app/(actions)/handle-auth";
import Link from "next/link";
import { db } from "@/app/lib/firebase";

export default async function Dashboard() {
  // Estamos no lado do Servidor!!!
 const session = await auth();

  console.log("Session: ", session);
  
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const userData = await db.collection("user").doc(session.user.id).get();
  const subscriptionStatus = userData.data()?.subscriptionStatus;

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
      <p className="mb-4">{session.user.email}</p>
      
      {subscriptionStatus === "active" && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Parabéns! 🎉</strong>
          <span className="block sm:inline"> Sua assinatura está ativa. Bem-vindo à plataforma!</span>
        </div>
      )}

      <Link href="/pagamentos" className="mt-4 border rounded-md px-4 py-2 cursor-pointer">
        Pagamentos
      </Link>
      <form action={handlersAuth} className="mt-4">
        <button type="submit" className="border rounded-md px-4 py-2 cursor-pointer">
          Logout
        </button>
      </form>
    </div>
  );
}
