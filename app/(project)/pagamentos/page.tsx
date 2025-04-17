"use client";

import { useStripe } from "@/app/hooks/useStripe";

export default function Pagamentos() {

const {createPaymentStripeCheckout,
     createSubscriptionStripeCheckout,
      handleCreatePortal
    }= useStripe();

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold mb-4">Pagamentos</h1>
            <button className= "border rounded-md px-1  mb-2" onClick={()=>
                createPaymentStripeCheckout ({
                    testeId: "123",
                    }) }
                    >Criar Pagamento Stripe</button>
            <button className= "border rounded-md px-1  mb-2" onClick={()=>
                createSubscriptionStripeCheckout ({
                    testeId: "123",
                    }) }
                    >Criar Assinatura Stripe</button>
            <button className= "border rounded-md px-1  mb-2" onClick={handleCreatePortal}>
                Criar Portal de Pagamentos
            </button>
        </div>
    );
}
