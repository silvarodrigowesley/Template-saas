import { handlersAuth } from "@/app/(actions)/handle-auth";

export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-2">Login</h1>
      <form
      action={handlersAuth}>
      <button type="submit" className= "border rounded-md px-4 py-2 cursor-pointer">Signin with Google</button>
    </form>
    </div>
  );
}