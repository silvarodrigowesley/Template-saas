import { db } from "@/app/lib/firebase";
import "server-only";
import Stripe from "stripe";

export async function handleStripeSubscription(event: Stripe.CheckoutSessionCompletedEvent) {
    console.log("Assinatura ativada");
    const customerId = event.data.object.customer;
    
    try {
        const userRef = await db.collection("user").where("stripeCustomerId", "==", customerId).get();

        if(userRef.empty) {
            console.log("Nenhum usuário encontrado com o ID do cliente:", customerId);
            return;
        }

        const userDoc = userRef.docs[0];
        console.log("Usuário encontrado:", userDoc.id);
        
        await userDoc.ref.update({
            subscriptionStatus: "active",
        });
        console.log("Status da assinatura atualizado para active");

    } catch (error) {
        console.error("Erro ao atualizar status da assinatura:", error);
    }
}
