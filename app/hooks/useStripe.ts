import {useEffect, useState} from "react";
import {loadStripe, Stripe} from "@stripe/stripe-js";

interface CheckoutData {
    testeId: string;
    useEmail?: string;
}

interface ResponseData {
    sessionId: string;
    error?: string;
}

interface PortalResponse {
    url: string;
    error?: string;
}

export function useStripe(){
    const [stripe, setStripe] = useState<Stripe | null>(null);
    

    useEffect(() => {
       async function loadStripeAsync(){
        const stripeInstance = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
        setStripe(stripeInstance);
       }
       loadStripeAsync();
    },[]);

    async function createPaymentStripeCheckout(checkoutData: CheckoutData){
        if(!stripe) return;
        try{
            const response = await fetch("/api/stripe/create-pay-checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(checkoutData),
            });
            const data: ResponseData = await response.json();

            await stripe.redirectToCheckout({sessionId: data.sessionId});
            console.log("data", data);
            

        }catch(error){
            console.error("Error creating payment checkout:", error);
            throw error;
        }
    }

    async function createSubscriptionStripeCheckout(checkoutData: CheckoutData){
        if(!stripe) return;
        try{
            const response = await fetch("/api/stripe/create-subscription-checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(checkoutData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ResponseData = await response.json();
            await stripe.redirectToCheckout({sessionId: data.sessionId});
            console.log("data", data);

        }catch(error){
            console.error("Error creating subscription checkout:", error);
            throw error;
        }
    }

    async function handleCreatePortal(){
        try{
            const response = await fetch("/api/stripe/create-portal", {
                method: "POST",
            });
            const data: PortalResponse = await response.json();
            window.location.href = data.url;
        }catch(error){
            console.error("Error creating portal:", error);
            throw error;
        }
    }

    return {
        createPaymentStripeCheckout,
        createSubscriptionStripeCheckout,
        handleCreatePortal
    };
}
