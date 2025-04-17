import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/firebase";
import stripe from "@/app/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest){
    const session = await auth();
    const userId = session?.user?.id;

    if(!userId) {
        return NextResponse.json({error: "Usuário nao Autorizado"}, {status: 401});
    }

   try{
    const userRef = db.collection("user").doc(userId);
    const userDoc = await userRef.get();

    if(!userDoc.exists) {
        return NextResponse.json({error: "Usuário não encontrado"}, {status: 404});
    }
    const customerId = userDoc.data()?.stripeCustomerId;

    if(!customerId) {
        return NextResponse.json({error: "Customer ID not found"}, {status: 400});
    }

    return NextResponse.json({url: "https://billing.stripe.com/p/login/test_14kfZbaSm9Ln9mUdQQ"});
    
   }catch(error){
    console.error("Error creating stripe customer:", error);
    return NextResponse.json({error: "Error creating stripe customer"}, {status: 500});
   }
}