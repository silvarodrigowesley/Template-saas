import stripe from "@/app/lib/stripe";
import { handleStripeCancelSubscription } from "@/app/server/stripe/handle-cancel";
import { handleStripePayment } from "@/app/server/stripe/handle-payment";
import { handleStripeSubscription } from "@/app/server/stripe/handle-subscription";
import { headers } from "next/headers";
import {NextRequest, NextResponse} from "next/server";

const secret = process.env.STRIPE_WEBHOOK_SECRET;

console.log("Webhook route carregada");
console.log("STRIPE_WEBHOOK_SECRET configurado:", !!secret);

export async function POST(request: NextRequest) {
    console.log("Webhook POST recebido");
    try {
        const body = await request.text();
        const headersList = await headers();
        const signature = headersList.get("stripe-signature");

        console.log("Webhook recebido - Iniciando processamento");
        console.log("Headers:", headersList);
        console.log("Signature:", signature);
   
        if(!signature) {
            console.error("Webhook sem assinatura");
            return NextResponse.json({error: "No signature"}, {status: 400});
        }

        if(!secret) {
            console.error("Webhook secret não configurado");
            return NextResponse.json({error: "Webhook secret not configured"}, {status: 500});
        }

        const event = stripe.webhooks.constructEvent(
            body,
            signature,
            secret
        );

        console.log("Evento Stripe recebido:", event.type);
        console.log("Dados do evento:", JSON.stringify(event.data.object, null, 2));

        switch(event.type) {
            case "checkout.session.completed":
                console.log("Checkout session completed - Iniciando processamento");
                const metadata = event.data.object.metadata;
                console.log("Metadata do evento:", metadata);
                console.log("Price ID do evento:", metadata?.price);
                console.log("STRIPE_PRODUCT_PRICE_ID:", process.env.STRIPE_PRODUCT_PRICE_ID);

                if(metadata?.price === process.env.STRIPE_PRODUCT_PRICE_ID) {
                    console.log("Processando pagamento único");
                    await handleStripePayment(event);
                }
                if(metadata?.price === process.env.STRIPE_SUBSCRIPTION_PRICE_ID) {
                    console.log("Processando assinatura");
                    await handleStripeSubscription(event);
                }
                break;
            case "checkout.session.expired":
                console.log("Pagamento expirado");
                break;
            case "checkout.session.async_payment_succeeded":
                console.log("Pagamento assíncrono realizado com sucesso");
                break;
            case "checkout.session.async_payment_failed":
                console.log("Pagamento assíncrono falhou");
                break;
            case "customer.subscription.created":
                console.log("Assinatura criada");
                break;
            case "customer.subscription.deleted":
                console.log("Processando cancelamento de assinatura");
                await handleStripeCancelSubscription(event);
                break;
            default:
                console.log("Evento não tratado:", event.type);
        }
        return NextResponse.json({message: "Webhook processado com sucesso"}, {status: 200});
    } catch (error) {
        console.error("Erro ao processar o webhook:", error);
        if (error instanceof Error) {
            console.error("Detalhes do erro:", error.message);
            console.error("Stack trace:", error.stack);
        }
        return NextResponse.json({error: "Erro ao processar o webhook"}, {status: 500});
    }
}
