import { db } from "@/app/lib/firebase";
import { NextResponse } from "next/server";
import "server-only";
import stripe from "@/app/lib/stripe";

export async function getOrCreateCustomer(userId: string, userEmail: string) {
    try {
        const userRef = db.collection("user").doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            // Criar o usuário se não existir
            await userRef.set({
                email: userEmail,
                createdAt: new Date(),
                stripeCustomerId: null,
                subscriptionStatus: "inactive"
            });
        }

        const stripeCustomerId = userDoc.data()?.stripeCustomerId;

        if (stripeCustomerId) {
            try {
                // Verificar se o cliente ainda existe no Stripe
                await stripe.customers.retrieve(stripeCustomerId);
                return stripeCustomerId;
            } catch (error) {
                console.log("Cliente não encontrado no Stripe, criando novo...");
                // Se o cliente não existir, removemos o ID antigo
                await userRef.update({
                    stripeCustomerId: null,
                    subscriptionStatus: "inactive"
                });
            }
        }

        const userName = userDoc.data()?.name;

        console.log("Criando novo cliente no Stripe...");
        const customer = await stripe.customers.create({
            email: userEmail,
            ...(userName && { name: userName }),
            metadata: {
                userId,
            },
        });

        console.log("Novo cliente criado:", customer.id);
        await userRef.update({
            stripeCustomerId: customer.id,
            subscriptionStatus: "inactive"
        });

        return customer.id;
        
    } catch (error) {
        console.error("Erro ao criar cliente na Stripe", error);
        throw error;
    }
}
