import { db } from "@/app/lib/firebase";
import stripe from "@/app/lib/stripe";

export async function getOrCreateCustomer(userId: string, userEmail: string) {
    try {
        const userRef = db.collection("user").doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        if (userData?.stripeCustomerId) {
            return userData.stripeCustomerId;
        }

        const customer = await stripe.customers.create({
            email: userEmail,
            metadata: { userId }
        });

        await userRef.update({
            stripeCustomerId: customer.id
        });

        return customer.id;
    } catch (err) {
        console.error("Erro ao obter/criar cliente:", err);
        throw err;
    }
}
