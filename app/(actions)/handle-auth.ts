"use server";
import { signIn, signOut, auth } from "@/app/lib/auth";


export async function handlersAuth() {
    const session = await auth();
    if (session) {
        return await signOut({
         redirectTo: "/login"
        });
    } 
        
    await signIn("google", {
         redirectTo: "/dashboard"
        
    });
    
}

