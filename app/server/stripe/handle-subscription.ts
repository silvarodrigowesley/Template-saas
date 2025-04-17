import { db } from "@/app/lib/firebase";
import "server-only";
import Stripe from "stripe";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
        const userData = userDoc.data();
        console.log("Usuário encontrado:", userDoc.id);
        
        await userDoc.ref.update({
            subscriptionStatus: "active",
        });
        console.log("Status da assinatura atualizado para active");

        // Enviar email de boas-vindas
        await resend.emails.send({
            from: "wesleyrodrigosilva1@gmail.com",
            to: userData.email,
            subject: "Bem-vindo à nossa plataforma! 🎉",
            html: `
                <h1>Bem-vindo à nossa plataforma!</h1>
                <p>Olá ${userData.name || 'usuário'},</p>
                <p>Estamos muito felizes em tê-lo conosco! Sua assinatura foi ativada com sucesso.</p>
                <p>Agora você tem acesso completo a todos os recursos da nossa plataforma.</p>
                <p>Se precisar de ajuda, não hesite em nos contatar.</p>
                <p>Atenciosamente,<br>Equipe da Plataforma</p>
            `
        });
        console.log("Email de boas-vindas enviado para:", userData.email);
    } catch (error) {
        console.error("Erro ao atualizar status da assinatura:", error);
    }
}
