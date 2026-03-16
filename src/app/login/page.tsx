"use client";

import { useActionState } from "react";
import { Card, CardBody, CardHeader, Input, Button } from "@heroui/react";
import { Navigation } from "lucide-react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm border border-default-200">
        <CardHeader className="flex flex-col items-center gap-2 pb-0 pt-6">
          <Navigation size={28} className="text-primary" />
          <h1 className="text-xl font-bold">Navigating Radiology</h1>
          <p className="text-sm text-default-500">Sign in to continue</p>
        </CardHeader>
        <CardBody className="px-6 pb-6">
          <form action={formAction} className="flex flex-col gap-4">
            <Input
              name="email"
              type="email"
              label="Email"
              placeholder="Enter your email"
              isRequired
              autoFocus
            />
            <Input
              name="password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              isRequired
            />
            {state?.error && (
              <p className="text-sm text-danger">{state.error}</p>
            )}
            <Button
              type="submit"
              color="primary"
              isLoading={pending}
              className="mt-2"
            >
              Sign In
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
