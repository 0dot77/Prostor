import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-bold tracking-tight">Prostor</h1>
          <p className="max-w-md text-lg text-zinc-500">
            A lightweight creative LMS for workshops and classes.
          </p>
        </div>
        <Link href="/login">
          <Button size="lg" className="px-8">
            시작하기
          </Button>
        </Link>
      </main>
    </div>
  );
}
