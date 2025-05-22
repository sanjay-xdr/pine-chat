import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message"; // Assuming this is correctly pathed
import { ChatBubbleLeftEllipsisIcon as AppLogoIcon, KeyIcon } from '@heroicons/react/24/outline';

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
console.log(searchParams)
  // Handle success message (e.g., "Password reset email sent")
  if ("success" in searchParams) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white pt-8 pb-10 px-6 shadow-xl rounded-lg sm:px-10 max-w-md w-full">
            <div className="mb-6 inline-block p-3 bg-green-500 rounded-xl">
                <AppLogoIcon className="h-8 w-8 text-white" />
            </div>
            <FormMessage message={searchParams} />
            <p className="mt-6">
                <Link
                    href="/sign-in"
                    className="font-medium text-green-600 hover:text-green-500 transition-colors"
                >
                    Return to Sign In
                </Link>
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white pt-8 pb-6 px-6 shadow-xl rounded-lg sm:px-10 max-w-md w-full">
        <div className="mb-8 text-center">
          {/* Using a KeyIcon here to visually represent password reset */}
          <div className="inline-block p-3 bg-green-100 rounded-xl">
            <KeyIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <h1 className="text-center text-2xl font-semibold text-gray-800">
          Forgot Your Password?
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          No worries! Enter your email address below and we'll send you a link to reset your password.
        </p>
        <p className="mt-1 text-center text-sm text-gray-600">
          Remember your password?{" "}
          <Link className="font-medium text-green-600 hover:text-green-500 transition-colors" href="/sign-in">
            Sign in
          </Link>
        </p>

        <form className="mt-8 space-y-6">
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </Label>
            <div className="mt-1">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                           focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
              />
            </div>
          </div>

          <div>
            <SubmitButton
              formAction={forgotPasswordAction}
              pendingText="Sending reset link..."
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                         bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                         focus:ring-green-500 transition-colors"
            >
              Send Password Reset Link
            </SubmitButton>
          </div>
          
          {/* Display general form messages/errors */}
          {!("message" in searchParams && searchParams.message === "success") && (
             <FormMessage message={searchParams} />
          )}
        </form>
      </div>

      <div className="mt-6 max-w-md w-full">
         <SmtpMessage />
      </div>

      <p className="mt-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Periskope. All rights reserved.
      </p>
    </div>
  );
}