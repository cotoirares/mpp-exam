import Link from "next/link";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  // Prefetch candidates data
  void api.candidates.getAll.prefetch();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-600 to-purple-700 text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <div className="text-center">
            <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl mb-4">
              Election <span className="text-yellow-300">2024</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl">
              Your voice matters. Learn about the candidates and make an informed decision for the future.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
            <Link
              className="flex flex-col gap-4 rounded-xl bg-white/10 p-6 hover:bg-white/20 transition-all duration-200 hover:scale-105"
              href="/candidates"
            >
              <div className="text-4xl mb-2">🗳️</div>
              <h3 className="text-2xl font-bold">View Candidates →</h3>
              <div className="text-lg text-blue-100">
                Browse all candidates, learn about their platforms, and see their qualifications.
              </div>
            </Link>
            
            <div className="flex flex-col gap-4 rounded-xl bg-white/10 p-6">
              <div className="text-4xl mb-2">📊</div>
              <h3 className="text-2xl font-bold">Voting Guide</h3>
              <div className="text-lg text-blue-100">
                Get informed about the voting process, important dates, and polling locations.
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-xl bg-white/10 p-6">
              <div className="text-4xl mb-2">📰</div>
              <h3 className="text-2xl font-bold">Election News</h3>
              <div className="text-lg text-blue-100">
                Stay updated with the latest election news, debates, and candidate announcements.
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <h2 className="text-2xl font-semibold mb-4">Ready to Learn About the Candidates?</h2>
            <Link
              href="/candidates"
              className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-lg text-xl font-bold hover:bg-yellow-300 transition-colors inline-block"
            >
              Get Started
            </Link>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
