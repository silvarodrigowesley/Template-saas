import stripe from "@/app/lib/stripe";
import { auth } from "@/app/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCustomer } from "@/app/server/stripe/get-customer-id";
import { db } from "@/app/lib/firebase";

export async function POST(request: NextRequest){
    try {
        console.log("Iniciando criação de checkout de assinatura");
        
        const {testeId, useEmail} = await request.json();
        console.log("Request data:", { testeId, useEmail });

        const price = process.env.STRIPE_SUBSCRIPTION_PRICE_ID; 
        console.log("Price ID:", price);

        if(!price) {
            console.error("Price ID not found in environment variables");
            return NextResponse.json({error: "Price not found"}, {status: 500});
        }

        const session = await auth();
        console.log("Auth session:", session);
        
        const userId = session?.user?.id;
        const userEmail = session?.user?.email;
        const userName = session?.user?.name;
        console.log("User data:", { userId, userEmail });

        if(!userEmail || !userId) {
            console.error("User not authenticated");
            return NextResponse.json({error: "Usuário não Autorizado"}, {status: 401});
        }

        console.log("Criando/obtendo customer ID...");
        let customerId;
        try {
            customerId = await getOrCreateCustomer(userId, userEmail);
            console.log("Customer ID obtido:", customerId);
        } catch (error) {
            console.error("Erro ao obter/criar cliente:", error);
            return NextResponse.json({error: "Erro ao obter/criar cliente"}, {status: 500});
        }

        if(!customerId) {
            console.error("Failed to get or create customer");
            return NextResponse.json({error: "Failed to get or create customer"}, {status: 500});
        }

        const metadata = {
            testeId,
            price: process.env.STRIPE_SUBSCRIPTION_PRICE_ID || ""
        }

        console.log("Criando sessão do Stripe...");
        try {
            const stripeSession = await stripe.checkout.sessions.create({
                line_items: [{price, quantity: 1}],
                mode: "subscription",
                payment_method_types: ["card"],
                success_url: `${request.headers.get("origin")}/success`,
                cancel_url: `${request.headers.get("origin")}/`,
                customer: customerId,
                metadata,
            });

            console.log("Stripe session created:", stripeSession);

            if(!stripeSession.url) {
                console.error("Session URL not found");
                return NextResponse.json({error: "Session URL not found"}, {status: 500});
            }

            return NextResponse.json({sessionId: stripeSession.id});
        } catch (error) {
            console.error("Erro ao criar sessão do Stripe:", error);
            // Se o erro for relacionado ao cliente, tentamos criar um novo
            if (error instanceof Error && error.message.includes("No such customer")) {
                console.log("Cliente não encontrado, tentando criar um novo...");
                try {
                    const newCustomer = await stripe.customers.create({
                        email: userEmail,
                        name: userName || undefined,
                        metadata: { userId }
                    });
                    
                    await db.collection("user").doc(userId).update({
                        stripeCustomerId: newCustomer.id
                    });

                    const newSession = await stripe.checkout.sessions.create({
                        line_items: [{price, quantity: 1}],
                        mode: "subscription",
                        payment_method_types: ["card"],
                        success_url: `${request.headers.get("origin")}/success`,
                        cancel_url: `${request.headers.get("origin")}/`,
                        customer: newCustomer.id,
                        metadata,
                    });

                    return NextResponse.json({sessionId: newSession.id});
                } catch (retryError) {
                    console.error("Erro ao tentar criar novo cliente:", retryError);
                    return NextResponse.json({error: "Erro ao criar novo cliente"}, {status: 500});
                }
            }
            throw error;
        }
    } catch(error) {
        console.error("Error in create-subscription-checkout:", error);
        if (error instanceof Error) {
            console.error("Error details:", error.message);
            console.error("Error stack:", error.stack);
        }
        return NextResponse.json(
            {error: "Error creating subscription checkout", details: error instanceof Error ? error.message : "Unknown error"}, 
            {status: 500}
        );
    }
}
