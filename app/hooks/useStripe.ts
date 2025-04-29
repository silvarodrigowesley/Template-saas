import {useEffect, useState} from "react";
import {loadStripe, Stripe} from "@stripe/stripe-js";

interface CheckoutData {
    testeId: string;
    useEmail?: string;
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
            const data = await response.json();

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

            const data = await response.json();
            
            if (!data.sessionId) {
                throw new Error('No session ID received from server');
            }

            await stripe.redirectToCheckout({sessionId: data.sessionId});
            console.log("data", data);      
        }catch(error){
            console.error("Error creating subscription checkout:", error);
            throw error;
        }
    }

    async function handleCreatePortal(){
    
         const response = await fetch("/api/stripe/create-portal", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
           
         });
        const data = await response.json();
        console.log("data", data);

        window.location.href = data.url;
    }

    return {createPaymentStripeCheckout, createSubscriptionStripeCheckout, handleCreatePortal};
}
