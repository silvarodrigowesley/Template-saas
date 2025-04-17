import { db } from "@/app/lib/firebase";
import "server-only";
import Stripe from "stripe";

export async function handleStripeCancelSubscription(event: Stripe.CustomerSubscriptionDeletedEvent) {
    console.log("Cancelou a assinatura");
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
            subscriptionStatus: "inactive",
        });
        console.log("Status da assinatura atualizado para inactive");
    } catch (error) {
        console.error("Erro ao atualizar status da assinatura:", error);
    }
}

