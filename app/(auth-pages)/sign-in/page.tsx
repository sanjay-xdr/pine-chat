import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ChatBubbleLeftEllipsisIcon as AppLogoIcon } from '@heroicons/react/24/outline'; // Consistent with chat app logo

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white pt-8 pb-6 px-6 shadow-xl rounded-lg sm:px-10 max-w-md w-full">
        <div className="mb-8 text-center">
          <div className="inline-block p-3 bg-green-500 rounded-xl"> {/* Rounded-xl like chat item avatar containers */}
            <AppLogoIcon className="h-8 w-8 text-white" />
          </div>
        </div>

        <h1 className="text-center text-2xl font-semibold text-gray-800">
          Sign in to your account
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link className="font-medium text-green-600 hover:text-green-500 transition-colors" href="/sign-up">
            create a new account
          </Link>
        </p>

        {/* 
          The form tag itself doesn't need 'action' if the SubmitButton handles formAction.
          The 'className' is for spacing between the main sections of the form.
        */}
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
                // Assuming your Input component accepts className for additional styling
                // These classes are typical for a styled input matching the theme
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                           focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="text-sm">
                <Link
                  className="font-medium text-green-600 hover:text-green-500 transition-colors"
                  href="/forgot-password"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
            <div className="mt-1">
              <Input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Your password"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                           focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
              />
            </div>
          </div>

          <div>
            <SubmitButton
              pendingText="Signing In..."
              formAction={signInAction}
              // Assuming your SubmitButton component accepts className for styling
              // These classes make it look like the primary buttons in the chat app
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                         bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                         focus:ring-green-500 transition-colors"
            >
              Sign in
            </SubmitButton>
          </div>

          {/* FormMessage component to display any messages (e.g., errors) */}
          <FormMessage message={searchParams} />
        </form>
      </div>
      <p className="mt-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Periskope. All rights reserved.
      </p>
    </div>
  );
}