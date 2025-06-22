export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Mckay's App Template</h1>
        <p className="text-lg text-gray-600 mb-8">
          The easiest way to start your next project.
        </p>
        <div className="space-x-4">
          <a 
            href="/dashboard" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Dashboard
          </a>
          <a 
            href="/figjam" 
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            FigJam Clone
          </a>
        </div>
      </div>
    </main>
  )
}