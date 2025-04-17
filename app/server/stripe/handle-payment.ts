import { db } from "@/app/lib/firebase";
import "server-only";
import Stripe from "stripe";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Desativa o parsing padrão do Next.js para ler o corpo cru (necessário para verificar o webhook)
export const config = {
    api: {
      bodyParser: false,
    },
  };

export async function handleStripePayment(event: Stripe.CheckoutSessionCompletedEvent) {
    console.log("Iniciando handleStripePayment");
    if(event.data.object.payment_status === "paid") {
        const metadata = event.data.object.metadata;
        const userId = metadata?.userId;
        const session = event.data.object;
        const amount = session.amount_total ? session.amount_total / 100 : 0;

        console.log("Dados do pagamento:", {
            userId,
            metadata,
            amount,
            paymentStatus: session.payment_status
        });

        if(!userId) {
            console.error("User ID not found in metadata");
            return;
        }   

        try {
            const userRef = db.collection("user").doc(userId);
            const userDoc = await userRef.get();
            const userData = userDoc.data();

            if (!userData) {
                console.error("User data not found");
                return;
            }

            console.log("Dados do usuário encontrados:", {
                email: userData.email,
                name: userData.name
            });

            // Salvar detalhes da compra
            const purchaseData = {
                userId,
                userEmail: userData.email,
                userName: userData.name,
                amount,
                currency: session.currency,
                paymentStatus: session.payment_status,
                createdAt: new Date(),
                stripeSessionId: session.id,
                productId: metadata?.testeId,
                priceId: metadata?.price
            };

            console.log("Tentando salvar compra:", purchaseData);

            const purchaseRef = await db.collection("purchases").add(purchaseData);
            console.log("Compra salva com sucesso. ID:", purchaseRef.id);

            // Atualizar status do usuário
            await userRef.update({
                stripeSubscriptionId: session.subscription,
                subscriptionStatus: "active",
            });
            console.log("Status do usuário atualizado");

            // Enviar email de confirmação de pagamento
            await resend.emails.send({
                from: "onboarding@resend.dev",
                to: userData.email,
                subject: "Pagamento confirmado! 🎉",
                html: `
                    <h1>Pagamento confirmado!</h1>
                    <p>Olá ${userData.name || 'usuário'},</p>
                    <p>Seu pagamento foi processado com sucesso.</p>
                    <p>Valor: R$ ${amount.toFixed(2)}</p>
                    <p>Obrigado por sua compra! Se precisar de ajuda, estamos à disposição.</p>
                    <p>Atenciosamente,<br>Equipe da Plataforma</p>
                `
            });
            console.log("Email de confirmação enviado para:", userData.email);
        } catch (error) {
            console.error("Erro ao processar pagamento:", error);
            if (error instanceof Error) {
                console.error("Detalhes do erro:", error.message);
                console.error("Stack trace:", error.stack);
            }
        }
    } else {
        console.log("Pagamento não está com status 'paid'");
    }
}
